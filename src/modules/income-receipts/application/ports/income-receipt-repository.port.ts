import type { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

export type RegisterInstallmentReceiptCommand = {
  idIncome: string;
  idIncomeInstallment: string;
  amountReceived: number;
  receivedAt?: Date;
};

export type ReceiptInstallmentView = {
  idIncomeInstallment: string;
  idIncome: string;
  installmentNumber: number;
  amountDue: number;
  amountReceived: number;
  dueDate: Date;
  receivedAt?: Date;
  status: IncomeStatus;
};

export type IncomeReceiptView = {
  idIncomeReceipt: string;
  idIncome: string;
  idIncomeInstallment?: string;
  idUsers: string;
  amountReceived: number;
  receivedAt: Date;
  createdAt: Date;
};

export type RegisterInstallmentReceiptResult = {
  idIncome: string;
  incomeStatus: IncomeStatus;
  receipts: IncomeReceiptView[];
  installments: ReceiptInstallmentView[];
};

export type UpdateIncomeReceiptCommand = {
  idIncomeReceipt: string;
  amountReceived?: number;
  receivedAt?: Date;
};

export interface IncomeReceiptRepositoryPort {
  registerInstallmentReceipt(
    idUsers: string,
    command: RegisterInstallmentReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult>;
  listReceiptsForIncome(
    idUsers: string,
    idIncome: string,
  ): Promise<IncomeReceiptView[]>;
  updateReceipt(
    idUsers: string,
    command: UpdateIncomeReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult>;
  deleteReceipt(
    idUsers: string,
    idIncomeReceipt: string,
  ): Promise<RegisterInstallmentReceiptResult>;
}

export const INCOME_RECEIPT_REPOSITORY = Symbol("INCOME_RECEIPT_REPOSITORY");
