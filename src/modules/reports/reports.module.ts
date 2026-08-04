import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { REPORT_REPOSITORY } from "@/modules/reports/application/ports/report-repository.port";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { ReportTypeormRepository } from "@/modules/reports/infrastructure/persistence/typeorm/repositories/report-typeorm.repository";
import { ReportsResolver } from "@/modules/reports/presentation/graphql/resolvers/reports.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([DebtEntity, DebtInstallmentEntity]),
    AuthModule,
  ],
  providers: [
    GetDebtsReportUseCase,
    ReportsResolver,
    ReportTypeormRepository,
    {
      provide: REPORT_REPOSITORY,
      useExisting: ReportTypeormRepository,
    },
  ],
})
export class ReportsModule {}
