import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  REPORT_REPOSITORY,
  type MonthlyAmountRow,
  type ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";

export interface MonthlyCashflowTrendInput {
  dueDateFrom: Date;
  dueDateTo: Date;
}

export interface MonthlyCashflowPoint {
  month: string;
  expenses: number;
  income: number;
  balance: number;
}

@Injectable()
export class GetMonthlyCashflowTrendUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input: MonthlyCashflowTrendInput,
  ): Promise<MonthlyCashflowPoint[]> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const [expenseRows, incomeRows] = await Promise.all([
      this.reportRepository.getDebtsPaidAmountByMonth(userId, input),
      this.reportRepository.getIncomesReceivedAmountByMonth(userId, input),
    ]);

    const expenseByMonth = this.toMonthMap(expenseRows);
    const incomeByMonth = this.toMonthMap(incomeRows);

    return this.enumerateMonths(input.dueDateFrom, input.dueDateTo).map(
      (month) => {
        const expenses = expenseByMonth.get(month) ?? 0;
        const income = incomeByMonth.get(month) ?? 0;

        return {
          month,
          expenses,
          income,
          balance: Number((income - expenses).toFixed(2)),
        };
      },
    );
  }

  private toMonthMap(rows: MonthlyAmountRow[]): Map<string, number> {
    return new Map(rows.map((row) => [row.month, row.amount]));
  }

  // Every month between dueDateFrom and dueDateTo, inclusive, even ones with
  // no installments — a trend line needs a continuous axis, not gaps where a
  // month happened to have zero activity.
  private enumerateMonths(from: Date, to: Date): string[] {
    const months: string[] = [];
    let year = from.getUTCFullYear();
    let month = from.getUTCMonth();
    const endYear = to.getUTCFullYear();
    const endMonth = to.getUTCMonth();

    while (year < endYear || (year === endYear && month <= endMonth)) {
      months.push(`${year}-${String(month + 1).padStart(2, "0")}`);
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }

    return months;
  }
}
