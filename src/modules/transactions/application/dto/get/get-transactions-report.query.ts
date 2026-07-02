import type { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

export type GetTransactionsReportQuery = {
  startDate?: Date;
  endDate?: Date;
  idAccount?: string;
  type?: TransactionType;
};
