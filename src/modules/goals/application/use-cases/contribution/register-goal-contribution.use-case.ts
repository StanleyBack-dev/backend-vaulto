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
  type RegisterGoalContributionPayload,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { RegisterGoalContributionCommand } from "@/modules/goals/application/dto/contribution/register-goal-contribution.command";

@Injectable()
export class RegisterGoalContributionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: RegisterGoalContributionCommand,
  ): Promise<FinancialGoalView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    if (!Number.isFinite(command.amount) || command.amount <= 0) {
      throw AppException.from(
        APP_ERRORS.goals.invalidContributionAmount,
        undefined,
      );
    }

    const payload: RegisterGoalContributionPayload = {
      idFinancialGoal: command.idFinancialGoal,
      amount: Number(command.amount.toFixed(2)),
      contributedAt: command.contributedAt,
      note: command.note,
    };

    return this.goalRepository.registerContribution(userId, payload);
  }
}
