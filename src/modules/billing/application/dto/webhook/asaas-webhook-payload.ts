export interface AsaasWebhookPaymentPayload {
  id: string;
  subscription?: string;
  // Present on payments generated under a Pix Automático authorization
  // (paymentCreationMode: SUBSCRIPTION) instead of `subscription`.
  pixAutomaticAuthorizationId?: string;
  value: number;
  status: string;
  dueDate?: string;
}

export interface AsaasWebhookSubscriptionPayload {
  id: string;
  status: string;
}

export interface AsaasWebhookTransferPayload {
  id: string;
  status: string;
  failReason?: string | null;
}

export interface AsaasWebhookPayload {
  event: string;
  payment?: AsaasWebhookPaymentPayload;
  subscription?: AsaasWebhookSubscriptionPayload;
  // Pix Automático authorization lifecycle events (PIX_AUTOMATIC_RECURRING_
  // AUTHORIZATION_*) carry the authorization id as a bare string here,
  // unlike `payment`/`subscription` above which are full nested objects.
  pixAutomaticAuthorization?: string;
  // TRANSFER_DONE/TRANSFER_FAILED/etc — outbound Pix transfers, used here
  // exclusively for referral withdrawal payouts.
  transfer?: AsaasWebhookTransferPayload;
}
