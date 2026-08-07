import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { CategoriesModule } from "@/modules/categories/categories.module";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { INCOME_REPOSITORY } from "@/modules/incomes/application/ports/income-repository.port";
import { CreateIncomeUseCase } from "@/modules/incomes/application/use-cases/create/create-income.use-case";
import { DeleteIncomeUseCase } from "@/modules/incomes/application/use-cases/delete/delete-income.use-case";
import { GetIncomeByIdUseCase } from "@/modules/incomes/application/use-cases/get/get-income-by-id.use-case";
import { ListIncomesUseCase } from "@/modules/incomes/application/use-cases/get/list-incomes.use-case";
import { UpdateIncomeDetailsUseCase } from "@/modules/incomes/application/use-cases/update/update-income-details.use-case";
import { UpdateIncomeStatusUseCase } from "@/modules/incomes/application/use-cases/update/update-income-status.use-case";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { IncomeTypeormRepository } from "@/modules/incomes/infrastructure/persistence/typeorm/repositories/income-typeorm.repository";
import { IncomesResolver } from "@/modules/incomes/presentation/graphql/resolvers/incomes.resolver";
import "@/modules/incomes/presentation/graphql/enums/incomes-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IncomeEntity,
      IncomeInstallmentEntity,
      CategoryEntity,
    ]),
    CategoriesModule,
    AuthModule,
    BillingModule,
  ],
  providers: [
    CreateIncomeUseCase,
    GetIncomeByIdUseCase,
    ListIncomesUseCase,
    UpdateIncomeDetailsUseCase,
    UpdateIncomeStatusUseCase,
    DeleteIncomeUseCase,
    IncomesResolver,
    IncomeTypeormRepository,
    {
      provide: INCOME_REPOSITORY,
      useExisting: IncomeTypeormRepository,
    },
  ],
})
export class IncomesModule {}
