import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetCategoryComparisonUseCase } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { GetDebtsAmountByCategoryUseCase } from "@/modules/reports/application/use-cases/get-debts-amount-by-category.use-case";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { GetFinancialForecastUseCase } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";
import { GetFinancialHealthScoreUseCase } from "@/modules/reports/application/use-cases/get-financial-health-score.use-case";
import { GetIncomesAmountByCategoryUseCase } from "@/modules/reports/application/use-cases/get-incomes-amount-by-category.use-case";
import { GetIncomesReportUseCase } from "@/modules/reports/application/use-cases/get-incomes-report.use-case";
import { GetMonthlyCashflowTrendUseCase } from "@/modules/reports/application/use-cases/get-monthly-cashflow-trend.use-case";
import { CategoryAmountResponseDto } from "@/modules/reports/presentation/graphql/dtos/category-amount-response.dto";
import { CategoryComparisonResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-category-comparison-response.dto";
import { FinancialForecastResponseDto } from "@/modules/reports/presentation/graphql/dtos/financial-forecast-response.dto";
import { FinancialHealthScoreResponseDto } from "@/modules/reports/presentation/graphql/dtos/financial-health-score-response.dto";
import { GetCategoryAmountInputDto } from "@/modules/reports/presentation/graphql/dtos/get-category-amount-input.dto";
import { GetCategoryComparisonInputDto } from "@/modules/reports/presentation/graphql/dtos/get-category-comparison-input.dto";
import { GetDebtsReportInputDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-input.dto";
import { DebtsReportResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-response.dto";
import { GetFinancialForecastInputDto } from "@/modules/reports/presentation/graphql/dtos/get-financial-forecast-input.dto";
import { GetFinancialHealthScoreInputDto } from "@/modules/reports/presentation/graphql/dtos/get-financial-health-score-input.dto";
import { GetIncomesReportInputDto } from "@/modules/reports/presentation/graphql/dtos/get-incomes-report-input.dto";
import { IncomesReportResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-incomes-report-response.dto";
import { MonthlyCashflowPointDto } from "@/modules/reports/presentation/graphql/dtos/monthly-cashflow-point.dto";
import "@/modules/reports/presentation/graphql/enums/reports-graphql.enums";

@Resolver()
export class ReportsResolver {
  constructor(
    private readonly getDebtsReportUseCase: GetDebtsReportUseCase,
    private readonly getIncomesReportUseCase: GetIncomesReportUseCase,
    private readonly getDebtsAmountByCategoryUseCase: GetDebtsAmountByCategoryUseCase,
    private readonly getIncomesAmountByCategoryUseCase: GetIncomesAmountByCategoryUseCase,
    private readonly getMonthlyCashflowTrendUseCase: GetMonthlyCashflowTrendUseCase,
    private readonly getFinancialForecastUseCase: GetFinancialForecastUseCase,
    private readonly getCategoryComparisonUseCase: GetCategoryComparisonUseCase,
    private readonly getFinancialHealthScoreUseCase: GetFinancialHealthScoreUseCase,
  ) {}

  @Query(() => DebtsReportResponseDto, { name: "getDebtsReport" })
  @RequirePageAccess(PageAccessKey.DASHBOARD)
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getDebtsReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: GetDebtsReportInputDto,
  ) {
    const result = await this.getDebtsReportUseCase.execute(user.idUsers, {
      dueDateFrom: input?.dueDateFrom,
      dueDateTo: input?.dueDateTo,
      debtType: input?.debtType,
      idCategory: input?.idCategory,
    });

    return DebtsReportResponseDto.fromView(result);
  }

  @Query(() => IncomesReportResponseDto, { name: "getIncomesReport" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getIncomesReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: GetIncomesReportInputDto,
  ) {
    const result = await this.getIncomesReportUseCase.execute(user.idUsers, {
      dueDateFrom: input?.dueDateFrom,
      dueDateTo: input?.dueDateTo,
      incomeType: input?.incomeType,
      idCategory: input?.idCategory,
    });

    return IncomesReportResponseDto.fromView(result);
  }

  @Query(() => [CategoryAmountResponseDto], {
    name: "getDebtsAmountByCategory",
  })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getDebtsAmountByCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCategoryAmountInputDto,
  ) {
    const result = await this.getDebtsAmountByCategoryUseCase.execute(
      user.idUsers,
      { dueDateFrom: input.dueDateFrom, dueDateTo: input.dueDateTo },
    );

    return result.map((row) => CategoryAmountResponseDto.fromView(row));
  }

  @Query(() => [CategoryAmountResponseDto], {
    name: "getIncomesAmountByCategory",
  })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getIncomesAmountByCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCategoryAmountInputDto,
  ) {
    const result = await this.getIncomesAmountByCategoryUseCase.execute(
      user.idUsers,
      { dueDateFrom: input.dueDateFrom, dueDateTo: input.dueDateTo },
    );

    return result.map((row) => CategoryAmountResponseDto.fromView(row));
  }

  @Query(() => [MonthlyCashflowPointDto], { name: "getMonthlyCashflowTrend" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMonthlyCashflowTrend(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCategoryAmountInputDto,
  ) {
    const result = await this.getMonthlyCashflowTrendUseCase.execute(
      user.idUsers,
      { dueDateFrom: input.dueDateFrom, dueDateTo: input.dueDateTo },
    );

    return result.map((point) => MonthlyCashflowPointDto.fromView(point));
  }

  @Query(() => FinancialForecastResponseDto, { name: "getFinancialForecast" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getFinancialForecast(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetFinancialForecastInputDto,
  ) {
    const result = await this.getFinancialForecastUseCase.execute(
      user.idUsers,
      {
        currentBalance: input.currentBalance,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      },
    );

    return FinancialForecastResponseDto.fromView(result);
  }

  @Query(() => CategoryComparisonResponseDto, { name: "getCategoryComparison" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getCategoryComparison(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: GetCategoryComparisonInputDto,
  ) {
    const result = await this.getCategoryComparisonUseCase.execute(
      user.idUsers,
      {
        periodType: input?.periodType,
        referenceDate: input?.referenceDate,
        comparisonDate: input?.comparisonDate,
      },
    );

    return CategoryComparisonResponseDto.fromView(result);
  }

  @Query(() => FinancialHealthScoreResponseDto, {
    name: "getFinancialHealthScore",
  })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getFinancialHealthScore(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true })
    input?: GetFinancialHealthScoreInputDto,
  ) {
    const result = await this.getFinancialHealthScoreUseCase.execute(
      user.idUsers,
      { periodEnd: input?.periodEnd },
    );

    return FinancialHealthScoreResponseDto.fromView(result);
  }
}
