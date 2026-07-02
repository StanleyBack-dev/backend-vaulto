import type { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

export type ListDebtsQuery = {
  page?: number;
  limit?: number;
  status?: DebtStatus;
  debtType?: DebtType;
};
