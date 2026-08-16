import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { GoalsModule } from "@/modules/goals/goals.module";
import { REPORT_REPOSITORY } from "@/modules/reports/application/ports/report-repository.port";
import { GetCategoryComparisonUseCase } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { GetDebtsAmountByCategoryUseCase } from "@/modules/reports/application/use-cases/get-debts-amount-by-category.use-case";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { GetFinancialForecastUseCase } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";
import { GetFinancialHealthScoreUseCase } from "@/modules/reports/application/use-cases/get-financial-health-score.use-case";
import { GetIncomesAmountByCategoryUseCase } from "@/modules/reports/application/use-cases/get-incomes-amount-by-category.use-case";
import { GetIncomesReportUseCase } from "@/modules/reports/application/use-cases/get-incomes-report.use-case";
import { GetMonthlyCashflowTrendUseCase } from "@/modules/reports/application/use-cases/get-monthly-cashflow-trend.use-case";
import { ReportTypeormRepository } from "@/modules/reports/infrastructure/persistence/typeorm/repositories/report-typeorm.repository";
import { ReportsResolver } from "@/modules/reports/presentation/graphql/resolvers/reports.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DebtEntity,
      DebtInstallmentEntity,
      IncomeEntity,
      IncomeInstallmentEntity,
      CategoryEntity,
    ]),
    AuthModule,
    BillingModule,
    GoalsModule,
  ],
  providers: [
    GetDebtsReportUseCase,
    GetIncomesReportUseCase,
    GetDebtsAmountByCategoryUseCase,
    GetIncomesAmountByCategoryUseCase,
    GetMonthlyCashflowTrendUseCase,
    GetFinancialForecastUseCase,
    GetCategoryComparisonUseCase,
    GetFinancialHealthScoreUseCase,
    ReportsResolver,
    ReportTypeormRepository,
    {
      provide: REPORT_REPOSITORY,
      useExisting: ReportTypeormRepository,
    },
  ],
})
export class ReportsModule {}
