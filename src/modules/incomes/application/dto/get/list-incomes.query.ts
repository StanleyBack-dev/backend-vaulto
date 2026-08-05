import type { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type ListIncomesQuery = {
  page?: number;
  limit?: number;
  status?: IncomeStatus;
  incomeType?: IncomeType;
  idCategory?: string;
  expectedDateFrom?: Date;
  expectedDateTo?: Date;
};
