import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";
import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { SUBSCRIPTION_REPOSITORY } from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";
import { SubscriptionTypeormRepository } from "@/modules/billing/infrastructure/persistence/typeorm/repositories/subscription-typeorm.repository";
import { BillingResolver } from "@/modules/billing/presentation/graphql/resolvers/billing.resolver";
import "@/modules/billing/presentation/graphql/enums/billing-graphql.enums";

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity]), AuthModule],
  providers: [
    CreateDefaultSubscriptionUseCase,
    GetMySubscriptionUseCase,
    PlanLimitsService,
    BillingResolver,
    SubscriptionTypeormRepository,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useExisting: SubscriptionTypeormRepository,
    },
  ],
  exports: [
    SUBSCRIPTION_REPOSITORY,
    CreateDefaultSubscriptionUseCase,
    PlanLimitsService,
  ],
})
export class BillingModule {}
