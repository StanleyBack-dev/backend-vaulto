import type { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

export type CreateIncomePayload = {
  idUsers: string;
  idCategory: string;
  category: string;
  title: string;
  description?: string;
  incomeType: IncomeType;
  expectedAmount: number;
  expectedDate: Date;
  receivedAmount: number;
  receivedAt?: Date;
  isRecurring: boolean;
  status: IncomeStatus;
};

export type UpdateIncomeDetailsPayload = {
  idIncome: string;
  title?: string;
  description?: string;
  idCategory?: string;
  category?: string;
  incomeType?: IncomeType;
  expectedAmount?: number;
  expectedDate?: Date;
  receivedAmount?: number;
  receivedAt?: Date;
  isRecurring?: boolean;
};

export type UpdateIncomeStatusPayload = {
  idIncome: string;
  status: IncomeStatus;
};

export type IncomeView = {
  idIncome: string;
  idUsers: string;
  idCategory: string;
  category: string;
  title: string;
  description?: string;
  incomeType: IncomeType;
  expectedAmount: number;
  expectedDate: Date;
  receivedAmount: number;
  receivedAt?: Date;
  isRecurring: boolean;
  status: IncomeStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ListIncomesFilters = {
  page?: number;
  limit?: number;
  status?: IncomeStatus;
  incomeType?: IncomeType;
  idCategory?: string;
  expectedDateFrom?: Date;
  expectedDateTo?: Date;
};

export interface IncomeRepositoryPort {
  create(payload: CreateIncomePayload): Promise<IncomeView>;
  listByUser(
    idUsers: string,
    filters?: ListIncomesFilters,
  ): Promise<{ records: IncomeView[]; total: number }>;
  findById(idUsers: string, idIncome: string): Promise<IncomeView>;
  updateDetails(
    idUsers: string,
    payload: UpdateIncomeDetailsPayload,
  ): Promise<IncomeView>;
  updateStatus(
    idUsers: string,
    payload: UpdateIncomeStatusPayload,
  ): Promise<IncomeView>;
  delete(idUsers: string, idIncome: string): Promise<void>;
}

export const INCOME_REPOSITORY = Symbol("INCOME_REPOSITORY");
