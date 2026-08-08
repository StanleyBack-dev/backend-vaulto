import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { REPORT_REPOSITORY } from "@/modules/reports/application/ports/report-repository.port";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { GetFinancialForecastUseCase } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";
import { ReportTypeormRepository } from "@/modules/reports/infrastructure/persistence/typeorm/repositories/report-typeorm.repository";
import { ReportsResolver } from "@/modules/reports/presentation/graphql/resolvers/reports.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DebtEntity,
      DebtInstallmentEntity,
      IncomeEntity,
      IncomeInstallmentEntity,
    ]),
    AuthModule,
    BillingModule,
  ],
  providers: [
    GetDebtsReportUseCase,
    GetFinancialForecastUseCase,
    ReportsResolver,
    ReportTypeormRepository,
    {
      provide: REPORT_REPOSITORY,
      useExisting: ReportTypeormRepository,
    },
  ],
})
export class ReportsModule {}
