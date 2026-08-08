import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  PAYMENT_GATEWAY,
  type PaymentGatewayPort,
} from "@/modules/billing/application/ports/payment-gateway.port";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
  type SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(idUsers: string): Promise<SubscriptionView> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

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

    if (subscription.gatewaySubscriptionId) {
      await this.paymentGateway.cancelSubscription(
        subscription.gatewaySubscriptionId,
      );
    }

    const accessEndsAt =
      subscription.currentPeriodEnd ?? subscription.trialEndsAt;
    const alreadyLapsed = !accessEndsAt || accessEndsAt <= new Date();

    if (alreadyLapsed) {
      return this.subscriptionRepository.updateByUserId(idUsers, {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      });
    }

    return this.subscriptionRepository.updateByUserId(idUsers, {
      cancelAtPeriodEnd: true,
    });
  }
}
