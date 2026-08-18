import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { timingSafeEqual } from "crypto";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import type {
  AsaasWebhookPaymentPayload,
  AsaasWebhookPayload,
  AsaasWebhookSubscriptionPayload,
} from "@/modules/billing/application/dto/webhook/asaas-webhook-payload";
import {
  BILLING_PAYMENT_REPOSITORY,
  type BillingPaymentRepositoryPort,
} from "@/modules/billing/application/ports/billing-payment-repository.port";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
  type SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";
import { PAST_DUE_GRACE_PERIOD_DAYS } from "@/modules/billing/domain/constants/pro-plan.constant";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { PaymentOverdueEmailUseCase } from "@/modules/mails/application/use-cases/payment-overdue-email.use-case";
import { SubscriptionActivatedEmailUseCase } from "@/modules/mails/application/use-cases/subscription-activated-email.use-case";
import { SubscriptionContractedNotificationEmailUseCase } from "@/modules/mails/application/use-cases/subscription-contracted-notification-email.use-case";
import { ClawbackReferralCreditUseCase } from "@/modules/referrals/application/use-cases/clawback-referral-credit.use-case";
import { QualifyReferralUseCase } from "@/modules/referrals/application/use-cases/qualify-referral.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

const SETTLED_PAYMENT_EVENTS = new Set([
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
]);
const CANCELING_SUBSCRIPTION_EVENTS = new Set([
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_INACTIVATED",
]);
const PIX_AUTOMATIC_AUTHORIZATION_ACTIVATED_EVENT =
  "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED";
const CANCELING_PIX_AUTOMATIC_AUTHORIZATION_EVENTS = new Set([
  "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED",
  "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED",
  "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED",
]);

const PAYMENT_STATUS_MAP: Record<string, BillingPaymentStatus> = {
  CONFIRMED: BillingPaymentStatus.CONFIRMED,
  RECEIVED: BillingPaymentStatus.RECEIVED,
  OVERDUE: BillingPaymentStatus.OVERDUE,
  REFUNDED: BillingPaymentStatus.REFUNDED,
  DELETED: BillingPaymentStatus.DELETED,
};

@Injectable()
export class HandleAsaasWebhookUseCase {
  constructor(
    private readonly configService: ConfigService,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(BILLING_PAYMENT_REPOSITORY)
    private readonly billingPaymentRepository: BillingPaymentRepositoryPort,
    private readonly subscriptionActivatedEmailUseCase: SubscriptionActivatedEmailUseCase,
    private readonly subscriptionContractedNotificationEmailUseCase: SubscriptionContractedNotificationEmailUseCase,
    private readonly paymentOverdueEmailUseCase: PaymentOverdueEmailUseCase,
    private readonly qualifyReferralUseCase: QualifyReferralUseCase,
    private readonly clawbackReferralCreditUseCase: ClawbackReferralCreditUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    receivedToken: string | undefined,
    payload: AsaasWebhookPayload,
  ): Promise<void> {
    this.assertValidToken(receivedToken);

    if (payload.payment) {
      await this.handlePaymentEvent(payload.event, payload.payment);
      return;
    }

    if (payload.subscription) {
      await this.handleSubscriptionEvent(payload.event, payload.subscription);
      return;
    }

    if (payload.pixAutomaticAuthorization) {
      await this.handlePixAutomaticAuthorizationEvent(
        payload.event,
        payload.pixAutomaticAuthorization,
      );
    }
  }

  private assertValidToken(receivedToken?: string): void {
    const expectedToken = this.configService.get<string>("ASAAS_WEBHOOK_TOKEN");

    if (
      !expectedToken ||
      !receivedToken ||
      !this.tokensMatch(receivedToken, expectedToken)
    ) {
      throw AppException.from(
        APP_ERRORS.billing.invalidWebhookToken,
        undefined,
      );
    }
  }

  private tokensMatch(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  }

  private async handlePaymentEvent(
    event: string,
    payment: AsaasWebhookPaymentPayload,
  ): Promise<void> {
    const subscription = payment.subscription
      ? await this.subscriptionRepository.findByGatewaySubscriptionId(
          payment.subscription,
        )
      : payment.pixAutomaticAuthorizationId
        ? await this.subscriptionRepository.findByGatewayPixAuthorizationId(
            payment.pixAutomaticAuthorizationId,
          )
        : null;
    if (!subscription) {
      return;
    }

    await this.billingPaymentRepository.upsertByGatewayPaymentId({
      idUsers: subscription.idUsers,
      gatewayPaymentId: payment.id,
      amount: payment.value,
      status:
        PAYMENT_STATUS_MAP[payment.status] ?? BillingPaymentStatus.PENDING,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
      paidAt: SETTLED_PAYMENT_EVENTS.has(event) ? new Date() : undefined,
    });

    if (SETTLED_PAYMENT_EVENTS.has(event)) {
      const baseDate = payment.dueDate ? new Date(payment.dueDate) : new Date();
      await this.activatePro(subscription, baseDate);
      return;
    }

    if (event === "PAYMENT_OVERDUE") {
      await this.markPastDue(subscription);
      return;
    }

    if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      await this.downgradeToFree(subscription.idUsers);
      await this.clawbackReferralCreditUseCase.execute(subscription.idUsers);
    }
  }

  private async handleSubscriptionEvent(
    event: string,
    subscriptionPayload: AsaasWebhookSubscriptionPayload,
  ): Promise<void> {
    if (!CANCELING_SUBSCRIPTION_EVENTS.has(event)) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByGatewaySubscriptionId(
        subscriptionPayload.id,
      );
    if (!subscription) {
      return;
    }

    await this.downgradeToFree(subscription.idUsers);
  }

  private async handlePixAutomaticAuthorizationEvent(
    event: string,
    pixAutomaticAuthorizationId: string,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findByGatewayPixAuthorizationId(
        pixAutomaticAuthorizationId,
      );
    if (!subscription) {
      return;
    }

    if (event === PIX_AUTOMATIC_AUTHORIZATION_ACTIVATED_EVENT) {
      // The immediate QR Code payment that establishes consent has just
      // settled — same meaning as a first PAYMENT_CONFIRMED/RECEIVED on the
      // card/boleto checkout flow.
      await this.activatePro(subscription, new Date());
      return;
    }

    if (CANCELING_PIX_AUTOMATIC_AUTHORIZATION_EVENTS.has(event)) {
      await this.downgradeToFree(subscription.idUsers);
    }
  }

  private async activatePro(
    subscription: SubscriptionView,
    periodBaseDate: Date,
  ): Promise<void> {
    const { idUsers } = subscription;
    // Checked on plan, not status: every subscription (including a brand
    // new FREE one) already starts out with status ACTIVE, so status alone
    // can't tell a first-ever activation from a renewal now that there's no
    // TRIALING interim state.
    const wasActive =
      subscription.plan === SubscriptionPlan.PRO &&
      subscription.status === SubscriptionStatus.ACTIVE;
    const currentPeriodEnd = this.computeNextPeriodEnd(
      subscription,
      periodBaseDate,
    );

    await this.subscriptionRepository.updateByUserId(idUsers, {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      pastDueSince: null,
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    });

    if (!wasActive) {
      await this.notifySubscriptionActivated(
        idUsers,
        subscription.billingCycle,
      );
      await this.qualifyReferralUseCase.execute(idUsers);
    }
  }

  private async markPastDue(subscription: SubscriptionView): Promise<void> {
    if (subscription.pastDueSince) {
      return;
    }

    await this.subscriptionRepository.updateByUserId(subscription.idUsers, {
      status: SubscriptionStatus.PAST_DUE,
      pastDueSince: new Date(),
    });
    await this.notifyPaymentOverdue(subscription.idUsers);
  }

  private async downgradeToFree(idUsers: string): Promise<void> {
    await this.subscriptionRepository.updateByUserId(idUsers, {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.CANCELED,
      cancelAtPeriodEnd: false,
      pastDueSince: null,
    });
  }

  // The subscription is paying for access up to the due date of the charge
  // that was just confirmed plus one more billing cycle — that's when Asaas
  // will generate (and attempt to charge) the next one.
  private computeNextPeriodEnd(
    subscription: SubscriptionView,
    baseDate: Date,
  ): Date | undefined {
    if (!subscription.billingCycle) {
      return undefined;
    }

    const nextPeriodEnd = new Date(baseDate);

    if (subscription.billingCycle === SubscriptionBillingCycle.YEARLY) {
      nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
    } else {
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    }

    return nextPeriodEnd;
  }

  private async notifySubscriptionActivated(
    idUsers: string,
    billingCycle?: SubscriptionBillingCycle,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      return;
    }

    await this.subscriptionActivatedEmailUseCase.send({
      to: user.email,
      name: user.name,
    });

    await this.subscriptionContractedNotificationEmailUseCase.send({
      userName: user.name,
      userEmail: user.email,
      billingCycle,
      confirmedAt: new Date(),
    });
  }

  private async notifyPaymentOverdue(idUsers: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      return;
    }

    await this.paymentOverdueEmailUseCase.send({
      to: user.email,
      name: user.name,
      graceDays: PAST_DUE_GRACE_PERIOD_DAYS,
    });
  }
}
