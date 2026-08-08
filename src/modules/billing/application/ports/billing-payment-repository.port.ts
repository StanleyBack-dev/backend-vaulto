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

export interface BillingPaymentRepositoryPort {
  upsertByGatewayPaymentId(
    payload: UpsertBillingPaymentPayload,
  ): Promise<BillingPaymentView>;
}

export const BILLING_PAYMENT_REPOSITORY = Symbol("BILLING_PAYMENT_REPOSITORY");
