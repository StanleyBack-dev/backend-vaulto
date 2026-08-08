import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  REPORT_REPOSITORY,
  type ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";
import { DEFAULT_FORECAST_WINDOW_DAYS } from "@/modules/reports/domain/constants/financial-forecast.constant";

export interface GetFinancialForecastInput {
  currentBalance: number;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface FinancialForecastView {
  currentBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  safeToSpend: number;
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class GetFinancialForecastUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input: GetFinancialForecastInput,
  ): Promise<FinancialForecastView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const periodStart = input.periodStart ?? new Date();
    const periodEnd =
      input.periodEnd ??
      this.addDays(periodStart, DEFAULT_FORECAST_WINDOW_DAYS);

    // Deliberately no dueDateFrom floor: an OVERDUE installment is still an
    // outstanding obligation regardless of how long ago it was due, and
    // must still count against "safe to spend" — only settled amounts
    // (amountPaid/amountReceived) ever drop out of the total.
    const [debtsReport, incomesReport] = await Promise.all([
      this.reportRepository.getDebtsReport(userId, {
        dueDateTo: periodEnd,
      }),
      this.reportRepository.getIncomesReport(userId, {
        dueDateTo: periodEnd,
      }),
    ]);

    const projectedIncome = incomesReport.totalOutstanding;
    const projectedExpenses = debtsReport.totalOutstanding;
    const safeToSpend = Number(
      (input.currentBalance + projectedIncome - projectedExpenses).toFixed(2),
    );

    return {
      currentBalance: input.currentBalance,
      projectedIncome,
      projectedExpenses,
      safeToSpend,
      periodStart,
      periodEnd,
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
