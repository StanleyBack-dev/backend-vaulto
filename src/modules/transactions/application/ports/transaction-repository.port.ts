import type { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";
import type { CreateTransactionCommand } from "@/modules/transactions/application/dto/create/create-transaction.command";

export type CreateTransactionPayload = Omit<CreateTransactionCommand, "occurredAt"> & {
  idUsers: string;
  occurredAt: Date;
};

export type TransactionView = {
  idTransaction: string;
  idUsers: string;
  idAccount: string;
  type: TransactionType;
  amount: number;
  description?: string;
  occurredAt: Date;
  createdAt: Date;
};

export type ListTransactionsFilters = {
  page: number;
  limit: number;
  idAccount?: string;
  type?: TransactionType;
};

export type TransactionsReportFilters = {
  startDate?: Date;
  endDate?: Date;
  idAccount?: string;
  type?: TransactionType;
};

export type TransactionsByTypeReportView = {
  type: TransactionType;
  totalAmount: number;
  count: number;
};

export type TransactionsByAccountReportView = {
  idAccount: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  count: number;
};

export type TransactionsReportView = {
  startDate?: Date;
  endDate?: Date;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  totalCount: number;
  byType: TransactionsByTypeReportView[];
  byAccount: TransactionsByAccountReportView[];
};

export interface TransactionRepositoryPort {
  create(payload: CreateTransactionPayload): Promise<TransactionView>;
  listByUser(
    idUsers: string,
    filters: ListTransactionsFilters,
  ): Promise<{ records: TransactionView[]; total: number }>;
  getReportByUser(
    idUsers: string,
    filters?: TransactionsReportFilters,
  ): Promise<TransactionsReportView>;
}

export const TRANSACTION_REPOSITORY = Symbol("TRANSACTION_REPOSITORY");
