import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetCategoryComparisonUseCase } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { GetFinancialForecastUseCase } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";
import { CategoryComparisonResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-category-comparison-response.dto";
import { FinancialForecastResponseDto } from "@/modules/reports/presentation/graphql/dtos/financial-forecast-response.dto";
import { GetCategoryComparisonInputDto } from "@/modules/reports/presentation/graphql/dtos/get-category-comparison-input.dto";
import { GetDebtsReportInputDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-input.dto";
import { DebtsReportResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-response.dto";
import { GetFinancialForecastInputDto } from "@/modules/reports/presentation/graphql/dtos/get-financial-forecast-input.dto";

@Resolver()
export class ReportsResolver {
  constructor(
    private readonly getDebtsReportUseCase: GetDebtsReportUseCase,
    private readonly getFinancialForecastUseCase: GetFinancialForecastUseCase,
    private readonly getCategoryComparisonUseCase: GetCategoryComparisonUseCase,
  ) {}

  @Query(() => DebtsReportResponseDto, { name: "getDebtsReport" })
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
        referenceDate: input?.referenceDate,
        comparisonDate: input?.comparisonDate,
      },
    );

    return CategoryComparisonResponseDto.fromView(result);
  }
}
