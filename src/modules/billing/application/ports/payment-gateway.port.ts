export interface CreateGatewayCustomerInput {
  name: string;
  email: string;
  cpfCnpj: string;
  externalReference: string;
}

export interface CreateGatewayCustomerResult {
  gatewayCustomerId: string;
}

export interface CreateGatewaySubscriptionInput {
  gatewayCustomerId: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  externalReference: string;
}

export interface CreateGatewaySubscriptionResult {
  gatewaySubscriptionId: string;
  status: string;
  checkoutUrl?: string;
}

export interface CreatePixAutomaticAuthorizationInput {
  gatewayCustomerId: string;
  value: number;
  frequency: string;
  contractId: string;
  startDate: string;
  description: string;
}

export interface CreatePixAutomaticAuthorizationResult {
  pixAutomaticAuthorizationId: string;
  status: string;
  qrCodePayload?: string;
  qrCodeImage?: string;
}

export interface PaymentGatewayPort {
  createCustomer(
    input: CreateGatewayCustomerInput,
  ): Promise<CreateGatewayCustomerResult>;
  createSubscription(
    input: CreateGatewaySubscriptionInput,
  ): Promise<CreateGatewaySubscriptionResult>;
  createPixAutomaticAuthorization(
    input: CreatePixAutomaticAuthorizationInput,
  ): Promise<CreatePixAutomaticAuthorizationResult>;
  cancelSubscription(gatewaySubscriptionId: string): Promise<void>;
  cancelPixAutomaticAuthorization(
    pixAutomaticAuthorizationId: string,
  ): Promise<void>;
}

export const PAYMENT_GATEWAY = Symbol("PAYMENT_GATEWAY");
