import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type CreateIncomeCommand = {
  title: string;
  idCategory: string;
  description?: string;
  incomeType: IncomeType;
  expectedAmount: number;
  expectedDate: Date;
  isRecurring?: boolean;
};
