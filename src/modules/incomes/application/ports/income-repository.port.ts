import type { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import type { UpdateIncomeDetailsCommand } from "@/modules/incomes/application/dto/update/update-income-details.command";
import type { UpdateIncomeStatusCommand } from "@/modules/incomes/application/dto/update/update-income-status.command";

export type CreateIncomePayload = {
  idUsers: string;
  idCategory: string;
  category: string;
  title: string;
  description?: string;
  incomeType: IncomeType;
  totalAmount: number;
  dueDate?: Date;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount: number;
  isRecurring: boolean;
  status: IncomeStatus;
};

export type CreateIncomeInstallmentPayload = {
  installmentNumber: number;
  amountDue: number;
  dueDate: Date;
  amountReceived?: number;
  receivedAt?: Date;
  status: IncomeStatus;
};

export type IncomeInstallmentView = {
  idIncomeInstallment: string;
  idIncome: string;
  installmentNumber: number;
  amountDue: number;
  amountReceived: number;
  dueDate: Date;
  receivedAt?: Date;
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
  totalAmount: number;
  dueDate?: Date;
  endDate?: Date;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount: number;
  isRecurring: boolean;
  status: IncomeStatus;
  receivedAt?: Date;
  installments: IncomeInstallmentView[];
  createdAt: Date;
  updatedAt: Date;
};

export type ListIncomesFilters = {
  page?: number;
  limit?: number;
  status?: IncomeStatus;
  incomeType?: IncomeType;
  idCategory?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
};

export type UpdateIncomeStatusPayload = UpdateIncomeStatusCommand;

export type UpdateIncomeDetailsPayload = UpdateIncomeDetailsCommand & {
  category?: string;
};

export interface IncomeRepositoryPort {
  create(
    payload: CreateIncomePayload,
    installments: CreateIncomeInstallmentPayload[],
  ): Promise<IncomeView>;
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
