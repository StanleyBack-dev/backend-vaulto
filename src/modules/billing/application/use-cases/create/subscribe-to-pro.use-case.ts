import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import type { SubscribeToProCommand } from "@/modules/billing/application/dto/create/subscribe-to-pro.command";
import {
  PAYMENT_GATEWAY,
  type PaymentGatewayPort,
} from "@/modules/billing/application/ports/payment-gateway.port";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
  type SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";
import {
  PRO_PLAN_MONTHLY_PRICE,
  PRO_PLAN_TRIAL_DAYS,
} from "@/modules/billing/domain/constants/pro-plan.constant";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface SubscribeToProResult {
  subscription: SubscriptionView;
  checkoutUrl?: string;
}

@Injectable()
export class SubscribeToProUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly createDefaultSubscriptionUseCase: CreateDefaultSubscriptionUseCase,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    command: SubscribeToProCommand,
  ): Promise<SubscribeToProResult> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    const subscription =
      await this.createDefaultSubscriptionUseCase.execute(idUsers);

    if (
      subscription.plan === SubscriptionPlan.PRO &&
      (subscription.status === SubscriptionStatus.ACTIVE ||
        subscription.status === SubscriptionStatus.TRIALING)
    ) {
      throw AppException.from(APP_ERRORS.billing.alreadySubscribed, undefined);
    }

    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      throw AppException.from(
        APP_ERRORS.authorization.authenticatedUserNotFound,
        undefined,
      );
    }

    const gatewayCustomerId =
      subscription.gatewayCustomerId ??
      (
        await this.paymentGateway.createCustomer({
          name: user.name,
          email: user.email,
          cpfCnpj: command.cpfCnpj,
          externalReference: idUsers,
        })
      ).gatewayCustomerId;

    const trialEndsAt = this.addDays(new Date(), PRO_PLAN_TRIAL_DAYS);

    const gatewaySubscription = await this.paymentGateway.createSubscription({
      gatewayCustomerId,
      value: PRO_PLAN_MONTHLY_PRICE,
      nextDueDate: this.toDateOnly(trialEndsAt),
      description: "Vaulto Pro - assinatura mensal",
      externalReference: idUsers,
    });

    const updatedSubscription =
      await this.subscriptionRepository.updateByUserId(idUsers, {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt,
        gatewayCustomerId,
        gatewaySubscriptionId: gatewaySubscription.gatewaySubscriptionId,
      });

    return {
      subscription: updatedSubscription,
      checkoutUrl: gatewaySubscription.checkoutUrl,
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
