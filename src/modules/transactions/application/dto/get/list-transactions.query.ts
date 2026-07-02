import type { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

export type ListTransactionsQuery = {
  page?: number;
  limit?: number;
  idAccount?: string;
  type?: TransactionType;
};
