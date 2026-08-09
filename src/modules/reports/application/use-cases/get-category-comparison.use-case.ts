import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  REPORT_REPOSITORY,
  type CategoryAmountRow,
  type ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";

export interface GetCategoryComparisonInput {
  referenceDate?: Date;
  comparisonDate?: Date;
}

export interface CategoryComparisonEntry {
  idCategory: string;
  categoryName: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercent: number | null;
}

export interface CategoryComparisonGroupView {
  currentTotal: number;
  previousTotal: number;
  changeAmount: number;
  changePercent: number | null;
  categories: CategoryComparisonEntry[];
}

export interface CategoryComparisonView {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  previousPeriodStart: Date;
  previousPeriodEnd: Date;
  expenses: CategoryComparisonGroupView;
  income: CategoryComparisonGroupView;
}

@Injectable()
export class GetCategoryComparisonUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input: GetCategoryComparisonInput,
  ): Promise<CategoryComparisonView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const referenceDate = input.referenceDate ?? new Date();
    const currentPeriodStart = this.startOfMonthUTC(referenceDate);
    const currentPeriodEnd = this.endOfMonthUTC(currentPeriodStart);
    const previousPeriodStart = input.comparisonDate
      ? this.startOfMonthUTC(input.comparisonDate)
      : this.addMonthsUTC(currentPeriodStart, -1);
    const previousPeriodEnd = this.endOfMonthUTC(previousPeriodStart);

    const [currentExpenses, previousExpenses, currentIncome, previousIncome] =
      await Promise.all([
        this.reportRepository.getDebtsAmountByCategory(userId, {
          dueDateFrom: currentPeriodStart,
          dueDateTo: currentPeriodEnd,
        }),
        this.reportRepository.getDebtsAmountByCategory(userId, {
          dueDateFrom: previousPeriodStart,
          dueDateTo: previousPeriodEnd,
        }),
        this.reportRepository.getIncomesAmountByCategory(userId, {
          dueDateFrom: currentPeriodStart,
          dueDateTo: currentPeriodEnd,
        }),
        this.reportRepository.getIncomesAmountByCategory(userId, {
          dueDateFrom: previousPeriodStart,
          dueDateTo: previousPeriodEnd,
        }),
      ]);

    return {
      currentPeriodStart,
      currentPeriodEnd,
      previousPeriodStart,
      previousPeriodEnd,
      expenses: this.buildGroup(currentExpenses, previousExpenses),
      income: this.buildGroup(currentIncome, previousIncome),
    };
  }

  private buildGroup(
    current: CategoryAmountRow[],
    previous: CategoryAmountRow[],
  ): CategoryComparisonGroupView {
    const byId = new Map<
      string,
      { categoryName: string; currentAmount: number; previousAmount: number }
    >();

    for (const row of current) {
      byId.set(row.idCategory, {
        categoryName: row.categoryName,
        currentAmount: row.amount,
        previousAmount: 0,
      });
    }

    for (const row of previous) {
      const existing = byId.get(row.idCategory);
      if (existing) {
        existing.previousAmount = row.amount;
      } else {
        byId.set(row.idCategory, {
          categoryName: row.categoryName,
          currentAmount: 0,
          previousAmount: row.amount,
        });
      }
    }

    const categories = Array.from(byId.entries())
      .map(([idCategory, value]) => ({
        idCategory,
        categoryName: value.categoryName,
        currentAmount: value.currentAmount,
        previousAmount: value.previousAmount,
        changeAmount: this.round2(value.currentAmount - value.previousAmount),
        changePercent: this.percentChange(
          value.currentAmount,
          value.previousAmount,
        ),
      }))
      .sort((a, b) => b.currentAmount - a.currentAmount);

    const currentTotal = this.round2(
      categories.reduce((sum, entry) => sum + entry.currentAmount, 0),
    );
    const previousTotal = this.round2(
      categories.reduce((sum, entry) => sum + entry.previousAmount, 0),
    );

    return {
      currentTotal,
      previousTotal,
      changeAmount: this.round2(currentTotal - previousTotal),
      changePercent: this.percentChange(currentTotal, previousTotal),
      categories,
    };
  }

  private percentChange(current: number, previous: number): number | null {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }

    return Math.round(((current - previous) / previous) * 100);
  }

  private round2(value: number): number {
    return Number(value.toFixed(2));
  }

  private startOfMonthUTC(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private endOfMonthUTC(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  }

  private addMonthsUTC(date: Date, months: number): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
    );
  }
}
