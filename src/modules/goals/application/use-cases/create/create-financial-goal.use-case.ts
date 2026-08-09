import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  FINANCIAL_GOAL_REPOSITORY,
  type CreateFinancialGoalPayload,
  type FinancialGoalRepositoryPort,
  type FinancialGoalView,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { CreateFinancialGoalCommand } from "@/modules/goals/application/dto/create/create-financial-goal.command";
import { FinancialGoal } from "@/modules/goals/domain/entities/financial-goal.entity";

@Injectable()
export class CreateFinancialGoalUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: CreateFinancialGoalCommand,
  ): Promise<FinancialGoalView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const goal = FinancialGoal.create({
      idUsers: userId,
      title: command.title,
      description: command.description,
      targetAmount: command.targetAmount,
      targetDate: command.targetDate,
    });

    const primitive = goal.toPrimitive();
    const payload: CreateFinancialGoalPayload = {
      idUsers: primitive.idUsers,
      title: primitive.title,
      description: primitive.description,
      targetAmount: primitive.targetAmount,
      targetDate: primitive.targetDate,
    };

    return this.goalRepository.create(payload);
  }
}
