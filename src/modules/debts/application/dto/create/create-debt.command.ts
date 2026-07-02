import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

export type CreateDebtCommand = {
  idAccount: string;
  title: string;
  description?: string;
  debtType: DebtType;
  totalAmount: number;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount?: number;
};
