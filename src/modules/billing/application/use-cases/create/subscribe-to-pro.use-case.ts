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
import { PRO_PLAN_PRICES } from "@/modules/billing/domain/constants/pro-plan.constant";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface SubscribeToProResult {
  subscription: SubscriptionView;
  checkoutUrl?: string;
  pixQrCode?: {
    payload?: string;
    image?: string;
  };
}

// Asaas' Pix Automático frequency enum doesn't line up 1:1 with our billing
// cycles — MONTHLY matches, YEARLY maps to ANNUALLY.
const PIX_FREQUENCY_BY_CYCLE: Record<SubscriptionBillingCycle, string> = {
  [SubscriptionBillingCycle.MONTHLY]: "MONTHLY",
  [SubscriptionBillingCycle.YEARLY]: "ANNUALLY",
};

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
      subscription.status === SubscriptionStatus.ACTIVE
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

    let gatewayCustomerId = subscription.gatewayCustomerId;

    if (!gatewayCustomerId) {
      const customer = await this.paymentGateway.createCustomer({
        name: user.name,
        email: user.email,
        cpfCnpj: command.cpfCnpj,
        externalReference: idUsers,
      });
      gatewayCustomerId = customer.gatewayCustomerId;

      // Persisted immediately, before the calls below run, so a retry after
      // a failure (e.g. Asaas rejecting the subscription/authorization)
      // reuses this customer instead of creating a duplicate orphan in Asaas.
      await this.subscriptionRepository.updateByUserId(idUsers, {
        gatewayCustomerId,
      });
    }

    const description = `Vaulto Pro - assinatura ${command.billingCycle === SubscriptionBillingCycle.YEARLY ? "anual" : "mensal"}`;

    if (command.pixAutomatic) {
      return this.subscribeWithPixAutomatic(
        idUsers,
        command,
        gatewayCustomerId,
        description,
      );
    }

    return this.subscribeWithCheckout(
      idUsers,
      command,
      gatewayCustomerId,
      description,
    );
  }

  private async subscribeWithCheckout(
    idUsers: string,
    command: SubscribeToProCommand,
    gatewayCustomerId: string,
    description: string,
  ): Promise<SubscribeToProResult> {
    const gatewaySubscription = await this.paymentGateway.createSubscription({
      gatewayCustomerId,
      value: PRO_PLAN_PRICES[command.billingCycle],
      nextDueDate: this.toDateOnly(new Date()),
      cycle: command.billingCycle,
      description,
      externalReference: idUsers,
    });

    const updatedSubscription =
      await this.subscriptionRepository.updateByUserId(idUsers, {
        proStartedAt: new Date(),
        billingCycle: command.billingCycle,
        gatewayCustomerId,
        gatewaySubscriptionId: gatewaySubscription.gatewaySubscriptionId,
      });

    return {
      subscription: updatedSubscription,
      checkoutUrl: gatewaySubscription.checkoutUrl,
    };
  }

  private async subscribeWithPixAutomatic(
    idUsers: string,
    command: SubscribeToProCommand,
    gatewayCustomerId: string,
    description: string,
  ): Promise<SubscribeToProResult> {
    const authorization =
      await this.paymentGateway.createPixAutomaticAuthorization({
        gatewayCustomerId,
        value: PRO_PLAN_PRICES[command.billingCycle],
        frequency: PIX_FREQUENCY_BY_CYCLE[command.billingCycle],
        // contractId is capped at 35 chars by Asaas; a UUID with hyphens is
        // 36, so hyphens are stripped to fit (still unique per user).
        contractId: idUsers.replace(/-/g, ""),
        startDate: this.toDateOnly(new Date()),
        description,
      });

    const updatedSubscription =
      await this.subscriptionRepository.updateByUserId(idUsers, {
        proStartedAt: new Date(),
        billingCycle: command.billingCycle,
        gatewayCustomerId,
        gatewayPixAuthorizationId: authorization.pixAutomaticAuthorizationId,
      });

    return {
      subscription: updatedSubscription,
      pixQrCode: {
        payload: authorization.qrCodePayload,
        image: authorization.qrCodeImage,
      },
    };
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
