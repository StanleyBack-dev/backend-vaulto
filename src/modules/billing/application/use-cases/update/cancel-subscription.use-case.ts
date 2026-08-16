import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  PAYMENT_GATEWAY,
  type PaymentGatewayPort,
} from "@/modules/billing/application/ports/payment-gateway.port";
import {
  SUBSCRIPTION_CANCELLATION_REPOSITORY,
  type SubscriptionCancellationRepositoryPort,
} from "@/modules/billing/application/ports/subscription-cancellation-repository.port";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
  type SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { SubscriptionCanceledNotificationEmailUseCase } from "@/modules/mails/application/use-cases/subscription-canceled-notification-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface CancelSubscriptionCommand {
  reasons: CancellationReason[];
  otherReason?: string;
}

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(SUBSCRIPTION_CANCELLATION_REPOSITORY)
    private readonly subscriptionCancellationRepository: SubscriptionCancellationRepositoryPort,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly subscriptionCanceledNotificationEmailUseCase: SubscriptionCanceledNotificationEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    command: CancelSubscriptionCommand,
  ): Promise<SubscriptionView> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    if (!command.reasons.length) {
      throw AppException.from(
        APP_ERRORS.billing.cancellationReasonRequired,
        undefined,
      );
    }

    const subscription =
      await this.subscriptionRepository.findByUserId(idUsers);

    if (
      !subscription ||
      subscription.plan !== SubscriptionPlan.PRO ||
      subscription.cancelAtPeriodEnd
    ) {
      throw AppException.from(
        APP_ERRORS.billing.noActiveSubscriptionToCancel,
        undefined,
      );
    }

    const requestedAt = new Date();
    const accessEndsAt = subscription.currentPeriodEnd;
    const alreadyLapsed = !accessEndsAt || accessEndsAt <= requestedAt;
    const effectiveCancellationAt = alreadyLapsed ? requestedAt : accessEndsAt;
    const user = await this.userRepository.findOne({ where: { idUsers } });

    await this.subscriptionCancellationRepository.create({
      idUsers,
      email: user?.email,
      reasons: command.reasons,
      otherReason: command.otherReason,
      billingCycle: subscription.billingCycle,
      proStartedAt: subscription.proStartedAt,
      requestedAt,
      effectiveCancellationAt,
    });

    if (subscription.gatewaySubscriptionId) {
      await this.paymentGateway.cancelSubscription(
        subscription.gatewaySubscriptionId,
      );
    }

    if (subscription.gatewayPixAuthorizationId) {
      await this.paymentGateway.cancelPixAutomaticAuthorization(
        subscription.gatewayPixAuthorizationId,
      );
    }

    const updatedSubscription = alreadyLapsed
      ? await this.subscriptionRepository.updateByUserId(idUsers, {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false,
        })
      : await this.subscriptionRepository.updateByUserId(idUsers, {
          cancelAtPeriodEnd: true,
        });

    if (user) {
      await this.notifyCompanyOfCancellation(user, {
        reasons: command.reasons,
        otherReason: command.otherReason,
        billingCycle: subscription.billingCycle,
        proStartedAt: subscription.proStartedAt,
        requestedAt,
        effectiveCancellationAt,
      });
    }

    return updatedSubscription;
  }

  private async notifyCompanyOfCancellation(
    user: UserEntity,
    survey: {
      reasons: CancellationReason[];
      otherReason?: string;
      billingCycle?: SubscriptionView["billingCycle"];
      proStartedAt?: Date;
      requestedAt: Date;
      effectiveCancellationAt: Date;
    },
  ): Promise<void> {
    await this.subscriptionCanceledNotificationEmailUseCase.send({
      userName: user.name,
      userEmail: user.email,
      ...survey,
    });
  }
}
