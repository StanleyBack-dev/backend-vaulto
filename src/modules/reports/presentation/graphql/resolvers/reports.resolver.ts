import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetCategoryComparisonUseCase } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { GetFinancialForecastUseCase } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";
import { GetFinancialHealthScoreUseCase } from "@/modules/reports/application/use-cases/get-financial-health-score.use-case";
import { CategoryComparisonResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-category-comparison-response.dto";
import { FinancialForecastResponseDto } from "@/modules/reports/presentation/graphql/dtos/financial-forecast-response.dto";
import { FinancialHealthScoreResponseDto } from "@/modules/reports/presentation/graphql/dtos/financial-health-score-response.dto";
import { GetCategoryComparisonInputDto } from "@/modules/reports/presentation/graphql/dtos/get-category-comparison-input.dto";
import { GetDebtsReportInputDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-input.dto";
import { DebtsReportResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-response.dto";
import { GetFinancialForecastInputDto } from "@/modules/reports/presentation/graphql/dtos/get-financial-forecast-input.dto";
import { GetFinancialHealthScoreInputDto } from "@/modules/reports/presentation/graphql/dtos/get-financial-health-score-input.dto";
import "@/modules/reports/presentation/graphql/enums/reports-graphql.enums";

@Resolver()
export class ReportsResolver {
  constructor(
    private readonly getDebtsReportUseCase: GetDebtsReportUseCase,
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
