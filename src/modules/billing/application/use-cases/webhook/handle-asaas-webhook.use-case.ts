import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
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
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { PaymentOverdueEmailUseCase } from "@/modules/mails/application/use-cases/payment-overdue-email.use-case";
import { SubscriptionActivatedEmailUseCase } from "@/modules/mails/application/use-cases/subscription-activated-email.use-case";
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
    private readonly paymentOverdueEmailUseCase: PaymentOverdueEmailUseCase,
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

    if (!expectedToken || receivedToken !== expectedToken) {
      throw AppException.from(
        APP_ERRORS.billing.invalidWebhookToken,
        undefined,
      );
    }
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

    await this.applyPaymentEventToSubscription(subscription, event);
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
  ): Promise<void> {
    const { idUsers } = subscription;

    if (SETTLED_PAYMENT_EVENTS.has(event)) {
      const wasActive = subscription.status === SubscriptionStatus.ACTIVE;

      await this.subscriptionRepository.updateByUserId(idUsers, {
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        pastDueSince: null,
      });

      if (!wasActive) {
        await this.notifySubscriptionActivated(idUsers);
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

  private async notifySubscriptionActivated(idUsers: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      return;
    }

    await this.subscriptionActivatedEmailUseCase.send({
      to: user.email,
      name: user.name,
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
