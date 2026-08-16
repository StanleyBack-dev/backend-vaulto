import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

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

export type IncomesReportFilters = {
  dueDateFrom?: Date;
  dueDateTo?: Date;
  incomeType?: IncomeType;
  idCategory?: string;
};

export type IncomesReportStatusCounts = {
  pending: number;
  overdue: number;
  partiallyReceived: number;
  received: number;
};

export type IncomesReportView = {
  totalAmountDue: number;
  totalAmountReceived: number;
  totalOutstanding: number;
  totalCount: number;
  countByStatus: IncomesReportStatusCounts;
};

export type CategoryAmountFilters = {
  dueDateFrom: Date;
  dueDateTo: Date;
};

export type CategoryAmountRow = {
  idCategory: string;
  categoryName: string;
  amount: number;
};

export type MonthlyAmountFilters = {
  dueDateFrom: Date;
  dueDateTo: Date;
};

export type MonthlyAmountRow = {
  month: string;
  amount: number;
};

export interface ReportRepositoryPort {
  getDebtsReport(
    idUsers: string,
    filters?: DebtsReportFilters,
  ): Promise<DebtsReportView>;
  getIncomesReport(
    idUsers: string,
    filters?: IncomesReportFilters,
  ): Promise<IncomesReportView>;
  getDebtsAmountByCategory(
    idUsers: string,
    filters: CategoryAmountFilters,
  ): Promise<CategoryAmountRow[]>;
  getIncomesAmountByCategory(
    idUsers: string,
    filters: CategoryAmountFilters,
  ): Promise<CategoryAmountRow[]>;
  getDebtsPaidAmountByMonth(
    idUsers: string,
    filters: MonthlyAmountFilters,
  ): Promise<MonthlyAmountRow[]>;
  getIncomesReceivedAmountByMonth(
    idUsers: string,
    filters: MonthlyAmountFilters,
  ): Promise<MonthlyAmountRow[]>;
}

export const REPORT_REPOSITORY = Symbol("REPORT_REPOSITORY");
