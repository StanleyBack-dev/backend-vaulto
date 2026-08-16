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
    if (!payment.subscription) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByGatewaySubscriptionId(
        payment.subscription,
      );
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

    await this.applyPaymentEventToSubscription(subscription, event, payment);
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

    await this.subscriptionRepository.updateByUserId(subscription.idUsers, {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.CANCELED,
      cancelAtPeriodEnd: false,
      pastDueSince: null,
    });
  }

  private async applyPaymentEventToSubscription(
    subscription: SubscriptionView,
    event: string,
    payment: AsaasWebhookPaymentPayload,
  ): Promise<void> {
    const { idUsers } = subscription;

    if (SETTLED_PAYMENT_EVENTS.has(event)) {
      const wasActive = subscription.status === SubscriptionStatus.ACTIVE;
      const currentPeriodEnd = this.computeNextPeriodEnd(subscription, payment);

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
      return;
    }

    if (event === "PAYMENT_OVERDUE") {
      if (subscription.pastDueSince) {
        return;
      }

      await this.subscriptionRepository.updateByUserId(idUsers, {
        status: SubscriptionStatus.PAST_DUE,
        pastDueSince: new Date(),
      });
      await this.notifyPaymentOverdue(idUsers);
      return;
    }

    if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      await this.subscriptionRepository.updateByUserId(idUsers, {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        pastDueSince: null,
      });
    }
  }

  // The subscription is paying for access up to the due date of the charge
  // that was just confirmed plus one more billing cycle — that's when Asaas
  // will generate (and attempt to charge) the next one.
  private computeNextPeriodEnd(
    subscription: SubscriptionView,
    payment: AsaasWebhookPaymentPayload,
  ): Date | undefined {
    if (!subscription.billingCycle) {
      return undefined;
    }

    const baseDate = payment.dueDate ? new Date(payment.dueDate) : new Date();
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
