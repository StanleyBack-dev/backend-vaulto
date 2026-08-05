import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { INCOME_RECEIPT_REPOSITORY } from "@/modules/income-receipts/application/ports/income-receipt-repository.port";
import { ListIncomeReceiptsUseCase } from "@/modules/income-receipts/application/use-cases/list-income-receipts.use-case";
import { RegisterInstallmentReceiptUseCase } from "@/modules/income-receipts/application/use-cases/register-installment-receipt.use-case";
import { UpdateIncomeReceiptUseCase } from "@/modules/income-receipts/application/use-cases/update-income-receipt.use-case";
import { DeleteIncomeReceiptUseCase } from "@/modules/income-receipts/application/use-cases/delete-income-receipt.use-case";
import { IncomeReceiptEntity } from "@/modules/income-receipts/infrastructure/persistence/typeorm/entities/income-receipt.entity";
import { IncomeReceiptTypeormRepository } from "@/modules/income-receipts/infrastructure/persistence/typeorm/repositories/income-receipt-typeorm.repository";
import { IncomeReceiptsResolver } from "@/modules/income-receipts/presentation/graphql/resolvers/income-receipts.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([IncomeReceiptEntity]), AuthModule],
  providers: [
    RegisterInstallmentReceiptUseCase,
    ListIncomeReceiptsUseCase,
    UpdateIncomeReceiptUseCase,
    DeleteIncomeReceiptUseCase,
    IncomeReceiptsResolver,
    IncomeReceiptTypeormRepository,
    {
      provide: INCOME_RECEIPT_REPOSITORY,
      useExisting: IncomeReceiptTypeormRepository,
    },
  ],
})
export class IncomeReceiptsModule {}
