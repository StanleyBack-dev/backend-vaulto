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
  type UpdateFinancialGoalPayload,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { UpdateFinancialGoalCommand } from "@/modules/goals/application/dto/update/update-financial-goal.command";

@Injectable()
export class UpdateFinancialGoalUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateFinancialGoalCommand,
  ): Promise<FinancialGoalView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const title = command.title?.trim();
    if (command.title !== undefined && !title) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "title",
      });
    }

    if (
      command.targetAmount !== undefined &&
      (!Number.isFinite(command.targetAmount) || command.targetAmount <= 0)
    ) {
      throw AppException.from(APP_ERRORS.goals.invalidTargetAmount, undefined);
    }

    if (command.targetDate) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (command.targetDate < today) {
        throw AppException.from(APP_ERRORS.goals.targetDateInPast, undefined);
      }
    }

    const payload: UpdateFinancialGoalPayload = {
      idFinancialGoal: command.idFinancialGoal,
      title,
      description: command.description,
      targetAmount:
        command.targetAmount !== undefined
          ? Number(command.targetAmount.toFixed(2))
          : undefined,
      targetDate: command.targetDate,
    };

    return this.goalRepository.update(userId, payload);
  }
}
