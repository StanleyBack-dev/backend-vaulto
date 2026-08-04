import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

export type UpdateDebtDetailsCommand = {
  idDebt: string;
  title?: string;
  description?: string;
  idCategory?: string;
  debtType?: DebtType;
  acquiredAt?: Date;
  dueDate?: Date;
  totalAmount?: number;
};
