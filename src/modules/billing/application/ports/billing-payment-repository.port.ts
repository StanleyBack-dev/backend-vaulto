import type { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";

export type BillingPaymentView = {
  idBillingPayment: string;
  idUsers: string;
  gatewayPaymentId: string;
  amount: number;
  status: BillingPaymentStatus;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertBillingPaymentPayload = {
  idUsers: string;
  gatewayPaymentId: string;
  amount: number;
  status: BillingPaymentStatus;
  dueDate?: Date;
  paidAt?: Date;
};

export type ListBillingPaymentsFilters = {
  page?: number;
  limit?: number;
};

export interface BillingPaymentRepositoryPort {
  upsertByGatewayPaymentId(
    payload: UpsertBillingPaymentPayload,
  ): Promise<BillingPaymentView>;
  listByUser(
    idUsers: string,
    filters?: ListBillingPaymentsFilters,
  ): Promise<{ records: BillingPaymentView[]; total: number }>;
}

export const BILLING_PAYMENT_REPOSITORY = Symbol("BILLING_PAYMENT_REPOSITORY");
