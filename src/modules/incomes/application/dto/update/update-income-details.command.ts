import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type UpdateIncomeDetailsCommand = {
  idIncome: string;
  title?: string;
  description?: string;
  idCategory?: string;
  incomeType?: IncomeType;
  dueDate?: Date;
  totalAmount?: number;
  isRecurring?: boolean;
};
