import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { CategoriesModule } from "@/modules/categories/categories.module";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { CreditCardsModule } from "@/modules/credit-cards/credit-cards.module";
import { CreditCardEntity } from "@/modules/credit-cards/infrastructure/persistence/typeorm/entities/credit-card.entity";
import { DEBT_REPOSITORY } from "@/modules/debts/application/ports/debt-repository.port";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { DeleteDebtUseCase } from "@/modules/debts/application/use-cases/delete/delete-debt.use-case";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { UpdateDebtDetailsUseCase } from "@/modules/debts/application/use-cases/update/update-debt-details.use-case";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtPaymentEntity } from "@/modules/payments/infrastructure/persistence/typeorm/entities/debt-payment.entity";
import { DebtTypeormRepository } from "@/modules/debts/infrastructure/persistence/typeorm/repositories/debt-typeorm.repository";
import { DebtsResolver } from "@/modules/debts/presentation/graphql/resolvers/debts.resolver";
import "@/modules/debts/presentation/graphql/enums/debts-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DebtEntity,
      DebtInstallmentEntity,
      DebtPaymentEntity,
      CategoryEntity,
      CreditCardEntity,
    ]),
    CategoriesModule,
    CreditCardsModule,
    AuthModule,
  ],

  providers: [
    CreateDebtUseCase,
    GetDebtByIdUseCase,
    ListDebtsUseCase,
    UpdateDebtDetailsUseCase,
    UpdateDebtStatusUseCase,
    DeleteDebtUseCase,
    DebtsResolver,
    DebtTypeormRepository,
    {
      provide: DEBT_REPOSITORY,
      useExisting: DebtTypeormRepository,
    },
  ],
})
export class DebtsModule {}
