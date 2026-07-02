import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountsModule } from "@/modules/accounts/accounts.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { DEBT_REPOSITORY } from "@/modules/debts/application/ports/debt-repository.port";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { RegisterDebtPaymentUseCase } from "@/modules/debts/application/use-cases/payment/register-debt-payment.use-case";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtPaymentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-payment.entity";
import { DebtTypeormRepository } from "@/modules/debts/infrastructure/persistence/typeorm/repositories/debt-typeorm.repository";
import { DebtsResolver } from "@/modules/debts/presentation/graphql/resolvers/debts.resolver";
import "@/modules/debts/presentation/graphql/enums/debts-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([DebtEntity, DebtInstallmentEntity, DebtPaymentEntity]),
    AccountsModule,
    AuthModule,
  ],
  providers: [
    CreateDebtUseCase,
    GetDebtByIdUseCase,
    ListDebtsUseCase,
    RegisterDebtPaymentUseCase,
    UpdateDebtStatusUseCase,
    DebtsResolver,
    DebtTypeormRepository,
    {
      provide: DEBT_REPOSITORY,
      useExisting: DebtTypeormRepository,
    },
  ],
})
export class DebtsModule {}
