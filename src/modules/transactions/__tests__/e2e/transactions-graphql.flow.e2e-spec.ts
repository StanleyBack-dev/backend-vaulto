import { Test } from "@nestjs/testing";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  TRANSACTION_REPOSITORY,
  type CreateTransactionPayload,
  type ListTransactionsFilters,
  type TransactionRepositoryPort,
  type TransactionView,
  type TransactionsReportFilters,
  type TransactionsReportView,
} from "@/modules/transactions/application/ports/transaction-repository.port";
import { CreateTransactionUseCase } from "@/modules/transactions/application/use-cases/create/create-transaction.use-case";
import { GetTransactionsReportUseCase } from "@/modules/transactions/application/use-cases/get/get-transactions-report.use-case";
import { ListTransactionsUseCase } from "@/modules/transactions/application/use-cases/get/list-transactions.use-case";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";
import { TransactionsResolver } from "@/modules/transactions/presentation/graphql/resolvers/transactions.resolver";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";

class InMemoryTransactionRepository implements TransactionRepositoryPort {
  private transactions: TransactionView[] = [];
  private balances = new Map<string, number>([
    ["account-1", 200],
    ["account-2", 50],
  ]);

  async create(payload: CreateTransactionPayload): Promise<TransactionView> {
    const currentBalance = this.balances.get(payload.idAccount);

    if (currentBalance === undefined) {
      throw AppException.from(APP_ERRORS.accounts.notFound, undefined);
    }

    if (payload.type === TransactionType.EXPENSE && currentBalance < payload.amount) {
      throw AppException.from(APP_ERRORS.accounts.insufficientBalance, undefined);
    }

    const nextBalance =
      payload.type === TransactionType.INCOME
        ? currentBalance + payload.amount
        : currentBalance - payload.amount;

    this.balances.set(payload.idAccount, Number(nextBalance.toFixed(2)));

    const created: TransactionView = {
      idTransaction: `transaction-${this.transactions.length + 1}`,
      idUsers: payload.idUsers,
      idAccount: payload.idAccount,
      type: payload.type,
      amount: payload.amount,
      description: payload.description,
      occurredAt: payload.occurredAt,
      createdAt: new Date(),
    };

    this.transactions.unshift(created);
    return created;
  }

  async listByUser(
    idUsers: string,
    filters: ListTransactionsFilters,
  ): Promise<{ records: TransactionView[]; total: number }> {
    let records = this.transactions.filter((transaction) => transaction.idUsers === idUsers);

    if (filters.idAccount) {
      records = records.filter((transaction) => transaction.idAccount === filters.idAccount);
    }

    if (filters.type) {
      records = records.filter((transaction) => transaction.type === filters.type);
    }

    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;

    return {
      records: records.slice(start, end),
      total: records.length,
    };
  }

  async getReportByUser(
    idUsers: string,
    filters?: TransactionsReportFilters,
  ): Promise<TransactionsReportView> {
    let records = this.transactions.filter((transaction) => transaction.idUsers === idUsers);

    if (filters?.startDate) {
      records = records.filter((transaction) => transaction.occurredAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      records = records.filter((transaction) => transaction.occurredAt <= filters.endDate!);
    }

    if (filters?.idAccount) {
      records = records.filter((transaction) => transaction.idAccount === filters.idAccount);
    }

    if (filters?.type) {
      records = records.filter((transaction) => transaction.type === filters.type);
    }

    const totalIncome = records
      .filter((transaction) => transaction.type === TransactionType.INCOME)
      .reduce((acc, transaction) => acc + transaction.amount, 0);

    const totalExpense = records
      .filter((transaction) => transaction.type === TransactionType.EXPENSE)
      .reduce((acc, transaction) => acc + transaction.amount, 0);

    const byType = [TransactionType.INCOME, TransactionType.EXPENSE]
      .map((type) => {
        const typed = records.filter((transaction) => transaction.type === type);
        return {
          type,
          totalAmount: typed.reduce((acc, transaction) => acc + transaction.amount, 0),
          count: typed.length,
        };
      })
      .filter((row) => row.count > 0);

    const groupedByAccount = new Map<string, TransactionView[]>();
    for (const record of records) {
      const current = groupedByAccount.get(record.idAccount) ?? [];
      current.push(record);
      groupedByAccount.set(record.idAccount, current);
    }

    const byAccount = Array.from(groupedByAccount.entries()).map(
      ([idAccount, accountRecords]) => {
        const income = accountRecords
          .filter((record) => record.type === TransactionType.INCOME)
          .reduce((acc, record) => acc + record.amount, 0);
        const expense = accountRecords
          .filter((record) => record.type === TransactionType.EXPENSE)
          .reduce((acc, record) => acc + record.amount, 0);

        return {
          idAccount,
          totalIncome: income,
          totalExpense: expense,
          netAmount: Number((income - expense).toFixed(2)),
          count: accountRecords.length,
        };
      },
    );

    return {
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      totalIncome,
      totalExpense,
      netAmount: Number((totalIncome - totalExpense).toFixed(2)),
      totalCount: records.length,
      byType,
      byAccount,
    };
  }

  getAccountBalance(idAccount: string): number {
    return this.balances.get(idAccount) ?? 0;
  }
}

describe("Transactions GraphQL flow (create/report with balance)", () => {
  it("should create income and expense, update balance, and return aggregated report", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsResolver,
        CreateTransactionUseCase,
        ListTransactionsUseCase,
        GetTransactionsReportUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useClass: InMemoryTransactionRepository,
        },
        {
          provide: InMemoryTransactionRepository,
          useExisting: TRANSACTION_REPOSITORY,
        },
      ],
    }).compile();

    const resolver = moduleRef.get(TransactionsResolver);
    const repository = moduleRef.get(InMemoryTransactionRepository);
    const user = { idUsers: "user-1", username: "john", group: "USER" as never };

    await resolver.createTransaction(user, {
      idAccount: "account-1",
      type: TransactionType.INCOME,
      amount: 100,
    });

    await resolver.createTransaction(user, {
      idAccount: "account-1",
      type: TransactionType.EXPENSE,
      amount: 40,
    });

    expect(repository.getAccountBalance("account-1")).toBe(260);

    const listed = await resolver.getMyTransactions(user, {
      page: 1,
      limit: 10,
      idAccount: "account-1",
    });

    expect(listed.total).toBe(2);

    const report = await resolver.getMyTransactionsReport(user, {
      idAccount: "account-1",
    });

    expect(report.data.totalIncome).toBe(100);
    expect(report.data.totalExpense).toBe(40);
    expect(report.data.netAmount).toBe(60);

    await expect(
      resolver.createTransaction(user, {
        idAccount: "account-1",
        type: TransactionType.EXPENSE,
        amount: 300,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should filter report by period and type", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsResolver,
        CreateTransactionUseCase,
        ListTransactionsUseCase,
        GetTransactionsReportUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useClass: InMemoryTransactionRepository,
        },
      ],
    }).compile();

    const resolver = moduleRef.get(TransactionsResolver);
    const user = { idUsers: "user-1", username: "john", group: "USER" as never };

    await resolver.createTransaction(user, {
      idAccount: "account-1",
      type: TransactionType.INCOME,
      amount: 30,
      occurredAt: new Date("2026-06-01T10:00:00.000Z"),
    });

    await resolver.createTransaction(user, {
      idAccount: "account-1",
      type: TransactionType.EXPENSE,
      amount: 15,
      occurredAt: new Date("2026-06-10T10:00:00.000Z"),
    });

    await resolver.createTransaction(user, {
      idAccount: "account-1",
      type: TransactionType.INCOME,
      amount: 50,
      occurredAt: new Date("2026-07-01T10:00:00.000Z"),
    });

    const incomeReportInJune = await resolver.getMyTransactionsReport(user, {
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T23:59:59.999Z"),
      type: TransactionType.INCOME,
    });

    expect(incomeReportInJune.data.totalCount).toBe(1);
    expect(incomeReportInJune.data.totalIncome).toBe(30);
    expect(incomeReportInJune.data.totalExpense).toBe(0);
    expect(incomeReportInJune.data.netAmount).toBe(30);
    expect(incomeReportInJune.data.byType).toHaveLength(1);
    expect(incomeReportInJune.data.byType[0]?.type).toBe(TransactionType.INCOME);
  });
});


