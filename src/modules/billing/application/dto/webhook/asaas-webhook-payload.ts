export interface AsaasWebhookPaymentPayload {
  id: string;
  subscription?: string;
  value: number;
  status: string;
  dueDate?: string;
}

export interface AsaasWebhookSubscriptionPayload {
  id: string;
  status: string;
}

export interface AsaasWebhookPayload {
  event: string;
  payment?: AsaasWebhookPaymentPayload;
  subscription?: AsaasWebhookSubscriptionPayload;
}
