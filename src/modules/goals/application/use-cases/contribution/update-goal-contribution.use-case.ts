import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  FINANCIAL_GOAL_REPOSITORY,
  type FinancialGoalRepositoryPort,
  type FinancialGoalView,
  type UpdateGoalContributionPayload,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { UpdateGoalContributionCommand } from "@/modules/goals/application/dto/contribution/update-goal-contribution.command";

@Injectable()
export class UpdateGoalContributionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateGoalContributionCommand,
  ): Promise<FinancialGoalView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    if (
      command.amount !== undefined &&
      (!Number.isFinite(command.amount) || command.amount <= 0)
    ) {
      throw AppException.from(
        APP_ERRORS.goals.invalidContributionAmount,
        undefined,
      );
    }

    const payload: UpdateGoalContributionPayload = {
      idFinancialGoal: command.idFinancialGoal,
      idGoalContribution: command.idGoalContribution,
      amount:
        command.amount !== undefined
          ? Number(command.amount.toFixed(2))
          : undefined,
      contributedAt: command.contributedAt,
      note: command.note,
    };

    return this.goalRepository.updateContribution(userId, payload);
  }
}
