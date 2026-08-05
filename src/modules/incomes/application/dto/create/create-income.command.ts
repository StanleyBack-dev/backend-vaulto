import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type CreateIncomeCommand = {
  title: string;
  idCategory: string;
  description?: string;
  incomeType: IncomeType;
  totalAmount?: number;
  dueDate?: Date;
  hasInstallments: boolean;
  installmentCount?: number;
  installmentAmount?: number;
  isRecurring?: boolean;
};
