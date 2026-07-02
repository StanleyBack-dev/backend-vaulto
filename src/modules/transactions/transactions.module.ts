import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import {
  TRANSACTION_REPOSITORY,
} from "@/modules/transactions/application/ports/transaction-repository.port";
import { CreateTransactionUseCase } from "@/modules/transactions/application/use-cases/create/create-transaction.use-case";
import { GetTransactionsReportUseCase } from "@/modules/transactions/application/use-cases/get/get-transactions-report.use-case";
import { ListTransactionsUseCase } from "@/modules/transactions/application/use-cases/get/list-transactions.use-case";
import { TransactionEntity } from "@/modules/transactions/infrastructure/persistence/typeorm/entities/transaction.entity";
import { TransactionTypeormRepository } from "@/modules/transactions/infrastructure/persistence/typeorm/repositories/transaction-typeorm.repository";
import { TransactionsResolver } from "@/modules/transactions/presentation/graphql/resolvers/transactions.resolver";
import "@/modules/transactions/presentation/graphql/enums/transactions-graphql.enums";

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]), AuthModule],
  providers: [
    CreateTransactionUseCase,
    ListTransactionsUseCase,
    GetTransactionsReportUseCase,
    TransactionsResolver,
    TransactionTypeormRepository,
    {
      provide: TRANSACTION_REPOSITORY,
      useExisting: TransactionTypeormRepository,
    },
  ],
  exports: [TRANSACTION_REPOSITORY],
})
export class TransactionsModule {}
