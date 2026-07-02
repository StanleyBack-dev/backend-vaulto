import type { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import type { CreateDebtCommand } from "@/modules/debts/application/dto/create/create-debt.command";
import type { RegisterDebtPaymentCommand } from "@/modules/debts/application/dto/payment/register-debt-payment.command";
import type { UpdateDebtStatusCommand } from "@/modules/debts/application/dto/update/update-debt-status.command";

export type CreateDebtPayload = CreateDebtCommand & {
  idUsers: string;
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
  idUsers: string;
  amountPaid: number;
  paidAt: Date;
  createdAt: Date;
};

export type DebtView = {
  idDebt: string;
  idUsers: string;
  idAccount: string;
  title: string;
  description?: string;
  debtType: DebtType;
  totalAmount: number;
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
};

export type RegisterDebtPaymentPayload = RegisterDebtPaymentCommand;

export type UpdateDebtStatusPayload = UpdateDebtStatusCommand;

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
  registerPayment(
    idUsers: string,
    payload: RegisterDebtPaymentPayload,
  ): Promise<DebtView>;
  updateStatus(
    idUsers: string,
    payload: UpdateDebtStatusPayload,
  ): Promise<DebtView>;
}

export const DEBT_REPOSITORY = Symbol("DEBT_REPOSITORY");
