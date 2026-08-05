import type { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

export type UpdateIncomeStatusCommand = {
  idIncome: string;
  status: IncomeStatus;
};
