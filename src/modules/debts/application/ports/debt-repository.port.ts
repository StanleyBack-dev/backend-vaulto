import type { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import type { UpdateDebtDetailsCommand } from "@/modules/debts/application/dto/update/update-debt-details.command";
import type { UpdateDebtStatusCommand } from "@/modules/debts/application/dto/update/update-debt-status.command";

export type CreateDebtPayload = {
  idUsers: string;
  idCategory: string;
  title: string;
  category: string;
  idCreditCard?: string;
  creditCard?: string;
  description?: string;
  debtType: DebtType;
  totalAmount: number;
  dueDate?: Date;
  acquiredAt?: Date;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount: number;
  status: DebtStatus;
};

export type CreateDebtInstallmentPayload = {
  installmentNumber: number;
  amountDue: number;
  dueDate: Date;
  amountPaid?: number;
  paidAt?: Date;
  status: DebtStatus;
};

export type DebtInstallmentView = {
  idDebtInstallment: string;
  idDebt: string;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  paidAt?: Date;
  status: DebtStatus;
};

export type DebtPaymentView = {
  idDebtPayment: string;
  idDebt: string;
  idDebtInstallment?: string;
  idUsers: string;
  amountPaid: number;
  paidAt: Date;
  createdAt: Date;
};

export type DebtView = {
  idDebt: string;
  idUsers: string;
  idCategory: string;
  title: string;
  category: string;
  idCreditCard?: string;
  creditCard?: string;
  description?: string;
  debtType: DebtType;
  totalAmount: number;
  dueDate?: Date;
  acquiredAt?: Date;
  endDate?: Date;
  startDate: Date;
  hasInstallments: boolean;
  installmentCount: number;
  status: DebtStatus;
  settledAt?: Date;
  installments: DebtInstallmentView[];
  payments: DebtPaymentView[];
  createdAt: Date;
  updatedAt: Date;
};

export type ListDebtsFilters = {
  page?: number;
  limit?: number;
  status?: DebtStatus;
  debtType?: DebtType;
  idCategory?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
};

export type UpdateDebtStatusPayload = UpdateDebtStatusCommand;

export type UpdateDebtDetailsPayload = UpdateDebtDetailsCommand & {
  category?: string;
};

export interface DebtRepositoryPort {
  create(
    payload: CreateDebtPayload,
    installments: CreateDebtInstallmentPayload[],
  ): Promise<DebtView>;
  listByUser(
    idUsers: string,
    filters?: ListDebtsFilters,
  ): Promise<{ records: DebtView[]; total: number }>;
  findById(idUsers: string, idDebt: string): Promise<DebtView>;
  updateStatus(
    idUsers: string,
    payload: UpdateDebtStatusPayload,
  ): Promise<DebtView>;
  updateDetails(
    idUsers: string,
    payload: UpdateDebtDetailsPayload,
  ): Promise<DebtView>;
}

export const DEBT_REPOSITORY = Symbol("DEBT_REPOSITORY");
