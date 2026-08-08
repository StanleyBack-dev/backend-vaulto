import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { MailModule } from "@/modules/mails/mail.module";
import { BILLING_PAYMENT_REPOSITORY } from "@/modules/billing/application/ports/billing-payment-repository.port";
import { PAYMENT_GATEWAY } from "@/modules/billing/application/ports/payment-gateway.port";
import { SUBSCRIPTION_REPOSITORY } from "@/modules/billing/application/ports/subscription-repository.port";
import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";
import { SubscribeToProUseCase } from "@/modules/billing/application/use-cases/create/subscribe-to-pro.use-case";
import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { ListMyBillingPaymentsUseCase } from "@/modules/billing/application/use-cases/get/list-my-billing-payments.use-case";
import { RunSubscriptionLifecycleUseCase } from "@/modules/billing/application/use-cases/lifecycle/run-subscription-lifecycle.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { CancelSubscriptionUseCase } from "@/modules/billing/application/use-cases/update/cancel-subscription.use-case";
import { HandleAsaasWebhookUseCase } from "@/modules/billing/application/use-cases/webhook/handle-asaas-webhook.use-case";
import { AsaasPaymentGatewayProvider } from "@/modules/billing/infrastructure/gateways/asaas-payment-gateway.provider";
import { BillingPaymentEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/billing-payment.entity";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";
import { BillingPaymentTypeormRepository } from "@/modules/billing/infrastructure/persistence/typeorm/repositories/billing-payment-typeorm.repository";
import { SubscriptionTypeormRepository } from "@/modules/billing/infrastructure/persistence/typeorm/repositories/subscription-typeorm.repository";
import { AsaasWebhookController } from "@/modules/billing/presentation/rest/controllers/asaas-webhook.controller";
import { SubscriptionLifecycleController } from "@/modules/billing/presentation/rest/controllers/subscription-lifecycle.controller";
import { BillingResolver } from "@/modules/billing/presentation/graphql/resolvers/billing.resolver";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import "@/modules/billing/presentation/graphql/enums/billing-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      BillingPaymentEntity,
      UserEntity,
    ]),
    AuthModule,
    MailModule,
  ],
  controllers: [AsaasWebhookController, SubscriptionLifecycleController],
  providers: [
    CreateDefaultSubscriptionUseCase,
    GetMySubscriptionUseCase,
    ListMyBillingPaymentsUseCase,
    PlanLimitsService,
    SubscribeToProUseCase,
    CancelSubscriptionUseCase,
    HandleAsaasWebhookUseCase,
    RunSubscriptionLifecycleUseCase,
    BillingResolver,
    SubscriptionTypeormRepository,
    BillingPaymentTypeormRepository,
    AsaasPaymentGatewayProvider,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useExisting: SubscriptionTypeormRepository,
    },
    {
      provide: BILLING_PAYMENT_REPOSITORY,
      useExisting: BillingPaymentTypeormRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useExisting: AsaasPaymentGatewayProvider,
    },
  ],
  exports: [
    SUBSCRIPTION_REPOSITORY,
    CreateDefaultSubscriptionUseCase,
    PlanLimitsService,
  ],
})
export class BillingModule {}
