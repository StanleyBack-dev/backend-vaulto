import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

export type DebtsReportFilters = {
  dueDateFrom?: Date;
  dueDateTo?: Date;
  debtType?: DebtType;
  idCategory?: string;
};

export type DebtsReportStatusCounts = {
  open: number;
  overdue: number;
  partiallyPaid: number;
  paid: number;
};

export type DebtsReportView = {
  totalAmountDue: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  totalCount: number;
  countByStatus: DebtsReportStatusCounts;
};

export interface ReportRepositoryPort {
  getDebtsReport(
    idUsers: string,
    filters?: DebtsReportFilters,
  ): Promise<DebtsReportView>;
}

export const REPORT_REPOSITORY = Symbol("REPORT_REPOSITORY");
