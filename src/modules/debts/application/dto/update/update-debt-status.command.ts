import type { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

export type UpdateDebtStatusCommand = {
  idDebt: string;
  status: DebtStatus;
};
