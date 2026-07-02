import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AccountEntity } from "@/modules/accounts/infrastructure/persistence/typeorm/entities/account.entity";
import {
  type CreateTransactionPayload,
  type ListTransactionsFilters,
  type TransactionsReportFilters,
  type TransactionsReportView,
  type TransactionRepositoryPort,
  type TransactionView,
} from "@/modules/transactions/application/ports/transaction-repository.port";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";
import { TransactionEntity } from "@/modules/transactions/infrastructure/persistence/typeorm/entities/transaction.entity";

@Injectable()
export class TransactionTypeormRepository implements TransactionRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
  ) {}

  async create(payload: CreateTransactionPayload): Promise<TransactionView> {
    return this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(AccountEntity);
      const transactionRepository = manager.getRepository(TransactionEntity);

      const account = await accountRepository.findOne({
        where: {
          idUsers: payload.idUsers,
          idAccount: payload.idAccount,
          isActive: true,
        },
      });

      if (!account) {
        throw AppException.from(APP_ERRORS.accounts.notFound, undefined);
      }

      if (payload.type === TransactionType.EXPENSE) {
        if (Number(account.currentBalance) < payload.amount) {
          throw AppException.from(APP_ERRORS.accounts.insufficientBalance, undefined);
        }

        account.currentBalance = (Number(account.currentBalance) - payload.amount).toFixed(
          2,
        );
      }

      if (payload.type === TransactionType.INCOME) {
        account.currentBalance = (Number(account.currentBalance) + payload.amount).toFixed(
          2,
        );
      }

      await accountRepository.save(account);

      const entity = transactionRepository.create({
        idUsers: payload.idUsers,
        idAccount: payload.idAccount,
        type: payload.type,
        amount: payload.amount.toFixed(2),
        description: payload.description,
        occurredAt: payload.occurredAt,
      });

      const saved = await transactionRepository.save(entity);
      return this.mapToView(saved);
    });
  }

  async listByUser(
    idUsers: string,
    filters: ListTransactionsFilters,
  ): Promise<{ records: TransactionView[]; total: number }> {
    const qb = this.repository
      .createQueryBuilder("transaction")
      .where("transaction.idUsers = :idUsers", { idUsers })
      .orderBy("transaction.occurredAt", "DESC")
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit);

    if (filters.idAccount) {
      qb.andWhere("transaction.idAccount = :idAccount", {
        idAccount: filters.idAccount,
      });
    }

    if (filters.type) {
      qb.andWhere("transaction.type = :type", { type: filters.type });
    }

    const [rows, total] = await qb.getManyAndCount();
    return { records: rows.map((row) => this.mapToView(row)), total };
  }

  async getReportByUser(
    idUsers: string,
    filters?: TransactionsReportFilters,
  ): Promise<TransactionsReportView> {
    const qb = this.repository
      .createQueryBuilder("transaction")
      .where("transaction.idUsers = :idUsers", { idUsers });

    if (filters?.startDate) {
      qb.andWhere("transaction.occurredAt >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      qb.andWhere("transaction.occurredAt <= :endDate", {
        endDate: filters.endDate,
      });
    }

    if (filters?.idAccount) {
      qb.andWhere("transaction.idAccount = :idAccount", {
        idAccount: filters.idAccount,
      });
    }

    if (filters?.type) {
      qb.andWhere("transaction.type = :type", { type: filters.type });
    }

    const totalsRaw = await qb
      .clone()
      .select(
        "COALESCE(SUM(CASE WHEN transaction.type = 'INCOME' THEN transaction.amount ELSE 0 END), 0)",
        "totalIncome",
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN transaction.type = 'EXPENSE' THEN transaction.amount ELSE 0 END), 0)",
        "totalExpense",
      )
      .addSelect("COUNT(*)", "totalCount")
      .getRawOne<{
        totalIncome: string;
        totalExpense: string;
        totalCount: string;
      }>();

    const byTypeRaw = await qb
      .clone()
      .select("transaction.type", "type")
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "totalAmount")
      .addSelect("COUNT(*)", "count")
      .groupBy("transaction.type")
      .getRawMany<{
        type: TransactionType;
        totalAmount: string;
        count: string;
      }>();

    const byAccountRaw = await qb
      .clone()
      .select("transaction.idAccount", "idAccount")
      .addSelect(
        "COALESCE(SUM(CASE WHEN transaction.type = 'INCOME' THEN transaction.amount ELSE 0 END), 0)",
        "totalIncome",
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN transaction.type = 'EXPENSE' THEN transaction.amount ELSE 0 END), 0)",
        "totalExpense",
      )
      .addSelect("COUNT(*)", "count")
      .groupBy("transaction.idAccount")
      .getRawMany<{
        idAccount: string;
        totalIncome: string;
        totalExpense: string;
        count: string;
      }>();

    const totalIncome = Number(totalsRaw?.totalIncome ?? 0);
    const totalExpense = Number(totalsRaw?.totalExpense ?? 0);

    return {
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      totalIncome,
      totalExpense,
      netAmount: Number((totalIncome - totalExpense).toFixed(2)),
      totalCount: Number(totalsRaw?.totalCount ?? 0),
      byType: byTypeRaw.map((row) => ({
        type: row.type,
        totalAmount: Number(row.totalAmount),
        count: Number(row.count),
      })),
      byAccount: byAccountRaw.map((row) => {
        const rowIncome = Number(row.totalIncome);
        const rowExpense = Number(row.totalExpense);

        return {
          idAccount: row.idAccount,
          totalIncome: rowIncome,
          totalExpense: rowExpense,
          netAmount: Number((rowIncome - rowExpense).toFixed(2)),
          count: Number(row.count),
        };
      }),
    };
  }

  private mapToView(entity: TransactionEntity): TransactionView {
    return {
      idTransaction: entity.idTransaction,
      idUsers: entity.idUsers,
      idAccount: entity.idAccount,
      type: entity.type,
      amount: Number(entity.amount),
      description: entity.description,
      occurredAt: entity.occurredAt,
      createdAt: entity.createdAt,
    };
  }
}
