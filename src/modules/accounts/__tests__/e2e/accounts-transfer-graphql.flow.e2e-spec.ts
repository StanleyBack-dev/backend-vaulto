import { Test } from "@nestjs/testing";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
  type AccountView,
  type CreateAccountPayload,
  type TransferBetweenAccountsPayload,
  type TransferBetweenAccountsResult,
} from "@/modules/accounts/application/ports/account-repository.port";
import { CreateAccountUseCase } from "@/modules/accounts/application/use-cases/create/create-account.use-case";
import { ListAccountsUseCase } from "@/modules/accounts/application/use-cases/get/list-accounts.use-case";
import { TransferBetweenAccountsUseCase } from "@/modules/accounts/application/use-cases/transfer/transfer-between-accounts.use-case";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";
import { AccountsResolver } from "@/modules/accounts/presentation/graphql/resolvers/accounts.resolver";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";

class InMemoryAccountRepository implements AccountRepositoryPort {
  private accounts: AccountView[] = [];
  private transferCount = 0;

  async create(payload: CreateAccountPayload): Promise<AccountView> {
    const view: AccountView = {
      idAccount: `account-${this.accounts.length + 1}`,
      idUsers: payload.idUsers,
      name: payload.name,
      accountType: payload.accountType,
      initialBalance: payload.initialBalance,
      currentBalance: payload.initialBalance,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.push(view);
    return view;
  }

  async listByUser(idUsers: string): Promise<AccountView[]> {
    return this.accounts.filter((account) => account.idUsers === idUsers);
  }

  async findByIdAndUser(idUsers: string, idAccount: string): Promise<AccountView | null> {
    return (
      this.accounts.find(
        (account) =>
          account.idUsers === idUsers &&
          account.idAccount === idAccount &&
          account.isActive,
      ) ?? null
    );
  }

  async transferBetweenAccounts(
    payload: TransferBetweenAccountsPayload,
  ): Promise<TransferBetweenAccountsResult> {
    const source = await this.findByIdAndUser(payload.idUsers, payload.sourceAccountId);
    const destination = await this.findByIdAndUser(
      payload.idUsers,
      payload.destinationAccountId,
    );

    if (!source || !destination) {
      throw AppException.from(APP_ERRORS.accounts.notFound, undefined);
    }

    if (source.currentBalance < payload.amount) {
      throw AppException.from(APP_ERRORS.accounts.insufficientBalance, undefined);
    }

    source.currentBalance = Number((source.currentBalance - payload.amount).toFixed(2));
    source.updatedAt = new Date();

    destination.currentBalance = Number(
      (destination.currentBalance + payload.amount).toFixed(2),
    );
    destination.updatedAt = new Date();

    this.transferCount += 1;

    return {
      sourceAccount: source,
      destinationAccount: destination,
      transfer: {
        idAccountTransfer: `transfer-${this.transferCount}`,
        idUsers: payload.idUsers,
        sourceAccountId: payload.sourceAccountId,
        destinationAccountId: payload.destinationAccountId,
        amount: payload.amount,
        description: payload.description,
        transferredAt: payload.transferredAt ?? new Date(),
        createdAt: new Date(),
      },
    };
  }
}

describe("Accounts GraphQL flow (transfer)", () => {
  it("should transfer funds and update both balances", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountsResolver,
        CreateAccountUseCase,
        ListAccountsUseCase,
        TransferBetweenAccountsUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ACCOUNT_REPOSITORY,
          useClass: InMemoryAccountRepository,
        },
      ],
    }).compile();

    const resolver = moduleRef.get(AccountsResolver);
    const user = { idUsers: "user-1", username: "john", group: "USER" as never };

    const source = await resolver.createAccount(user, {
      name: "Carteira",
      accountType: AccountType.WALLET,
      initialBalance: 500,
    });

    const destination = await resolver.createAccount(user, {
      name: "Banco",
      accountType: AccountType.BANK,
      initialBalance: 100,
    });

    const transferred = await resolver.transferBetweenAccounts(user, {
      sourceAccountId: source.data.idAccount,
      destinationAccountId: destination.data.idAccount,
      amount: 150,
    });

    expect(transferred.data.sourceAccount.currentBalance).toBe(350);
    expect(transferred.data.destinationAccount.currentBalance).toBe(250);

    const listed = await resolver.getMyAccounts(user);
    const listedSource = listed.items.find(
      (account) => account.idAccount === source.data.idAccount,
    );
    const listedDestination = listed.items.find(
      (account) => account.idAccount === destination.data.idAccount,
    );

    expect(listedSource?.currentBalance).toBe(350);
    expect(listedDestination?.currentBalance).toBe(250);
  });
});


