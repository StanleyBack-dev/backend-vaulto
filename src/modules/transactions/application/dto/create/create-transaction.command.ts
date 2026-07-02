import type { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

export type CreateTransactionCommand = {
  idAccount: string;
  type: TransactionType;
  amount: number;
  description?: string;
  occurredAt?: Date;
};
