import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type UpdateIncomeDetailsCommand = {
  idIncome: string;
  title?: string;
  description?: string;
  idCategory?: string;
  incomeType?: IncomeType;
  expectedAmount?: number;
  expectedDate?: Date;
  receivedAmount?: number;
  receivedAt?: Date;
  isRecurring?: boolean;
};
