import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { ACCOUNT_REPOSITORY } from "@/modules/accounts/application/ports/account-repository.port";
import { CreateAccountUseCase } from "@/modules/accounts/application/use-cases/create/create-account.use-case";
import { ListAccountsUseCase } from "@/modules/accounts/application/use-cases/get/list-accounts.use-case";
import { TransferBetweenAccountsUseCase } from "@/modules/accounts/application/use-cases/transfer/transfer-between-accounts.use-case";
import { AccountEntity } from "@/modules/accounts/infrastructure/persistence/typeorm/entities/account.entity";
import { AccountTransferEntity } from "@/modules/accounts/infrastructure/persistence/typeorm/entities/account-transfer.entity";
import { AccountTypeormRepository } from "@/modules/accounts/infrastructure/persistence/typeorm/repositories/account-typeorm.repository";
import { AccountsResolver } from "@/modules/accounts/presentation/graphql/resolvers/accounts.resolver";
import "@/modules/accounts/presentation/graphql/enums/accounts-graphql.enums";

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity, AccountTransferEntity]), AuthModule],
  providers: [
    CreateAccountUseCase,
    ListAccountsUseCase,
    TransferBetweenAccountsUseCase,
    AccountsResolver,
    AccountTypeormRepository,
    {
      provide: ACCOUNT_REPOSITORY,
      useExisting: AccountTypeormRepository,
    },
  ],
  exports: [ACCOUNT_REPOSITORY],
})
export class AccountsModule {}
