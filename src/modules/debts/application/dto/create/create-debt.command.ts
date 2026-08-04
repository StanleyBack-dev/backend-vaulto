import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

export type CreateDebtCommand = {
  title: string;
  idCategory: string;
  idCreditCard?: string;
  description?: string;
  debtType: DebtType;
  totalAmount?: number;
  dueDate?: Date;
  acquiredAt?: Date;
  hasInstallments: boolean;
  installmentCount?: number;
  installmentAmount?: number;
};
