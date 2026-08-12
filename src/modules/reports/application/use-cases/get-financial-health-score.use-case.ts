import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  FINANCIAL_GOAL_REPOSITORY,
  type FinancialGoalRepositoryPort,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { computeGoalProgress } from "@/modules/goals/domain/services/goal-progress.service";
import {
  REPORT_REPOSITORY,
  type ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";
import { DEFAULT_FORECAST_WINDOW_DAYS } from "@/modules/reports/domain/constants/financial-forecast.constant";
import {
  computeFinancialHealthScore,
  type FinancialHealthScoreResult,
} from "@/modules/reports/domain/services/financial-health-score.service";

// Safety cap on goals sampled to average progress — a personal finance app
// realistically never has more goals than this, so it's effectively "all".
const MAX_GOALS_SAMPLE = 200;

export interface GetFinancialHealthScoreInput {
  periodEnd?: Date;
}

export interface FinancialHealthScoreView extends FinancialHealthScoreResult {
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class GetFinancialHealthScoreUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepositoryPort,
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input?: GetFinancialHealthScoreInput,
  ): Promise<FinancialHealthScoreView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const periodStart = new Date();
    const periodEnd =
      input?.periodEnd ??
      this.addDays(periodStart, DEFAULT_FORECAST_WINDOW_DAYS);

    const [debtsReport, incomesReport, goals] = await Promise.all([
      this.reportRepository.getDebtsReport(userId, { dueDateTo: periodEnd }),
      this.reportRepository.getIncomesReport(userId, {
        dueDateTo: periodEnd,
      }),
      this.goalRepository.listByUser(userId, { limit: MAX_GOALS_SAMPLE }),
    ]);

    const averageGoalsProgressPercent = this.computeAverageGoalsProgress(
      goals.records,
    );

    const result = computeFinancialHealthScore({
      outstandingDebts: debtsReport.totalOutstanding,
      outstandingIncome: incomesReport.totalOutstanding,
      totalDebtsCount: debtsReport.totalCount,
      overdueDebtsCount: debtsReport.countByStatus.overdue,
      averageGoalsProgressPercent,
    });

    return { ...result, periodStart, periodEnd };
  }

  private computeAverageGoalsProgress(
    goals: Array<{
      targetAmount: number;
      currentAmount: number;
      createdAt: Date;
    }>,
  ): number | null {
    if (goals.length === 0) {
      return null;
    }

    const totalProgress = goals.reduce((sum, goal) => {
      const progress = computeGoalProgress({
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        createdAt: goal.createdAt,
      });
      return sum + progress.progressPercent;
    }, 0);

    return totalProgress / goals.length;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
