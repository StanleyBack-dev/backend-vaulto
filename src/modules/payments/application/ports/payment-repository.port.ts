import type { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

export type RegisterInstallmentPaymentCommand = {
  idDebt: string;
  idDebtInstallment: string;
  amountPaid: number;
  paidAt?: Date;
};

export type PaymentInstallmentView = {
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

export type RegisterInstallmentPaymentResult = {
  idDebt: string;
  debtStatus: DebtStatus;
  payments: DebtPaymentView[];
  installments: PaymentInstallmentView[];
};

export type UpdateDebtPaymentCommand = {
  idDebtPayment: string;
  amountPaid?: number;
  paidAt?: Date;
};

export interface PaymentRepositoryPort {
  registerInstallmentPayment(
    idUsers: string,
    command: RegisterInstallmentPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult>;
  listPaymentsForDebt(
    idUsers: string,
    idDebt: string,
  ): Promise<DebtPaymentView[]>;
  updatePayment(
    idUsers: string,
    command: UpdateDebtPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult>;
  deletePayment(
    idUsers: string,
    idDebtPayment: string,
  ): Promise<RegisterInstallmentPaymentResult>;
}

export const PAYMENT_REPOSITORY = Symbol("PAYMENT_REPOSITORY");
