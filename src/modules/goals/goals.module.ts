import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { FINANCIAL_GOAL_REPOSITORY } from "@/modules/goals/application/ports/financial-goal-repository.port";
import { CreateFinancialGoalUseCase } from "@/modules/goals/application/use-cases/create/create-financial-goal.use-case";
import { DeleteFinancialGoalUseCase } from "@/modules/goals/application/use-cases/delete/delete-financial-goal.use-case";
import { GetFinancialGoalByIdUseCase } from "@/modules/goals/application/use-cases/get/get-financial-goal-by-id.use-case";
import { ListFinancialGoalsUseCase } from "@/modules/goals/application/use-cases/get/list-financial-goals.use-case";
import { UpdateFinancialGoalUseCase } from "@/modules/goals/application/use-cases/update/update-financial-goal.use-case";
import { RegisterGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/register-goal-contribution.use-case";
import { UpdateGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/update-goal-contribution.use-case";
import { DeleteGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/delete-goal-contribution.use-case";
import { FinancialGoalEntity } from "@/modules/goals/infrastructure/persistence/typeorm/entities/financial-goal.entity";
import { GoalContributionEntity } from "@/modules/goals/infrastructure/persistence/typeorm/entities/goal-contribution.entity";
import { FinancialGoalTypeormRepository } from "@/modules/goals/infrastructure/persistence/typeorm/repositories/financial-goal-typeorm.repository";
import { FinancialGoalsResolver } from "@/modules/goals/presentation/graphql/resolvers/financial-goals.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialGoalEntity, GoalContributionEntity]),
    AuthModule,
    BillingModule,
  ],
  providers: [
    CreateFinancialGoalUseCase,
    GetFinancialGoalByIdUseCase,
    ListFinancialGoalsUseCase,
    UpdateFinancialGoalUseCase,
    DeleteFinancialGoalUseCase,
    RegisterGoalContributionUseCase,
    UpdateGoalContributionUseCase,
    DeleteGoalContributionUseCase,
    FinancialGoalsResolver,
    FinancialGoalTypeormRepository,
    {
      provide: FINANCIAL_GOAL_REPOSITORY,
      useExisting: FinancialGoalTypeormRepository,
    },
  ],
})
export class GoalsModule {}
