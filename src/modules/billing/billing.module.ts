import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { MailModule } from "@/modules/mails/mail.module";
import { BILLING_PAYMENT_REPOSITORY } from "@/modules/billing/application/ports/billing-payment-repository.port";
import { PAYMENT_GATEWAY } from "@/modules/billing/application/ports/payment-gateway.port";
import { SUBSCRIPTION_CANCELLATION_REPOSITORY } from "@/modules/billing/application/ports/subscription-cancellation-repository.port";
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
import { SubscriptionCancellationEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription-cancellation.entity";
import { BillingPaymentTypeormRepository } from "@/modules/billing/infrastructure/persistence/typeorm/repositories/billing-payment-typeorm.repository";
import { SubscriptionCancellationTypeormRepository } from "@/modules/billing/infrastructure/persistence/typeorm/repositories/subscription-cancellation-typeorm.repository";
import { SubscriptionTypeormRepository } from "@/modules/billing/infrastructure/persistence/typeorm/repositories/subscription-typeorm.repository";
import { AsaasWebhookController } from "@/modules/billing/presentation/rest/controllers/asaas-webhook.controller";
import { SubscriptionLifecycleController } from "@/modules/billing/presentation/rest/controllers/subscription-lifecycle.controller";
import { BillingResolver } from "@/modules/billing/presentation/graphql/resolvers/billing.resolver";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { REFERRAL_CREDIT_REPOSITORY } from "@/modules/referrals/application/ports/referral-credit-repository.port";
import { REFERRAL_WITHDRAWAL_REPOSITORY } from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import { ClawbackReferralCreditUseCase } from "@/modules/referrals/application/use-cases/clawback-referral-credit.use-case";
import { QualifyReferralUseCase } from "@/modules/referrals/application/use-cases/qualify-referral.use-case";
import { SyncReferralWithdrawalTransferStatusUseCase } from "@/modules/referrals/application/use-cases/sync-referral-withdrawal-transfer-status.use-case";
import { ReferralCreditEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-credit.entity";
import { ReferralWithdrawalEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-withdrawal.entity";
import { ReferralCreditTypeormRepository } from "@/modules/referrals/infrastructure/persistence/typeorm/repositories/referral-credit-typeorm.repository";
import { ReferralWithdrawalTypeormRepository } from "@/modules/referrals/infrastructure/persistence/typeorm/repositories/referral-withdrawal-typeorm.repository";
import "@/modules/billing/presentation/graphql/enums/billing-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      SubscriptionCancellationEntity,
      BillingPaymentEntity,
      UserEntity,
      ReferralCreditEntity,
      ReferralWithdrawalEntity,
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
    SubscriptionCancellationTypeormRepository,
    BillingPaymentTypeormRepository,
    AsaasPaymentGatewayProvider,
    QualifyReferralUseCase,
    ClawbackReferralCreditUseCase,
    SyncReferralWithdrawalTransferStatusUseCase,
    ReferralCreditTypeormRepository,
    ReferralWithdrawalTypeormRepository,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useExisting: SubscriptionTypeormRepository,
    },
    {
      provide: SUBSCRIPTION_CANCELLATION_REPOSITORY,
      useExisting: SubscriptionCancellationTypeormRepository,
    },
    {
      provide: BILLING_PAYMENT_REPOSITORY,
      useExisting: BillingPaymentTypeormRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useExisting: AsaasPaymentGatewayProvider,
    },
    {
      provide: REFERRAL_CREDIT_REPOSITORY,
      useExisting: ReferralCreditTypeormRepository,
    },
    {
      provide: REFERRAL_WITHDRAWAL_REPOSITORY,
      useExisting: ReferralWithdrawalTypeormRepository,
    },
  ],
  exports: [
    SUBSCRIPTION_REPOSITORY,
    CreateDefaultSubscriptionUseCase,
    PlanLimitsService,
    CancelSubscriptionUseCase,
    PAYMENT_GATEWAY,
  ],
})
export class BillingModule {}
