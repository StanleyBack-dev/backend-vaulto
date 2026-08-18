import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import type {
  CreateGatewayCustomerInput,
  CreateGatewayCustomerResult,
  CreateGatewaySubscriptionInput,
  CreateGatewaySubscriptionResult,
  CreatePixAutomaticAuthorizationInput,
  CreatePixAutomaticAuthorizationResult,
  CreatePixTransferInput,
  CreatePixTransferResult,
  LookupPixKeyInput,
  LookupPixKeyResult,
  PaymentGatewayPort,
} from "@/modules/billing/application/ports/payment-gateway.port";

const SANDBOX_BASE_URL = "https://api-sandbox.asaas.com/v3";
const PRODUCTION_BASE_URL = "https://api.asaas.com/v3";

interface AsaasCustomerResponse {
  id: string;
}

interface AsaasSubscriptionResponse {
  id: string;
  status: string;
}

interface AsaasPaymentListResponse {
  data: Array<{ id: string; invoiceUrl?: string }>;
}

interface AsaasPixAutomaticAuthorizationResponse {
  id: string;
  status: string;
  payload?: string;
  encodedImage?: string;
}

interface AsaasTransferResponse {
  id: string;
  status: string;
  failReason?: string;
}

interface AsaasPixKeyLookupResponse {
  ispbName?: string;
  financialInstitution?: {
    name?: string;
    bank?: { name?: string };
  };
  owner?: {
    name?: string;
    cpfCnpj?: string;
  };
}

@Injectable()
export class AsaasPaymentGatewayProvider implements PaymentGatewayPort {
  private readonly logger = new Logger(AsaasPaymentGatewayProvider.name);
  private readonly apiKey?: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("ASAAS_API_KEY");
    this.baseUrl =
      this.configService.get<string>("ASAAS_ENVIRONMENT") === "production"
        ? PRODUCTION_BASE_URL
        : SANDBOX_BASE_URL;

    if (!this.apiKey) {
      this.logger.warn(
        "ASAAS_API_KEY não configurada. A integração de pagamento falhará até que a variável seja definida.",
      );
    }
  }

  async createCustomer(
    input: CreateGatewayCustomerInput,
  ): Promise<CreateGatewayCustomerResult> {
    const customer = await this.request<AsaasCustomerResponse>("/customers", {
      method: "POST",
      body: {
        name: input.name,
        email: input.email,
        cpfCnpj: input.cpfCnpj,
        externalReference: input.externalReference,
      },
    });

    return { gatewayCustomerId: customer.id };
  }

  async createSubscription(
    input: CreateGatewaySubscriptionInput,
  ): Promise<CreateGatewaySubscriptionResult> {
    const subscription = await this.request<AsaasSubscriptionResponse>(
      "/subscriptions",
      {
        method: "POST",
        body: {
          customer: input.gatewayCustomerId,
          billingType: "UNDEFINED",
          value: input.value,
          nextDueDate: input.nextDueDate,
          cycle: input.cycle,
          description: input.description,
          externalReference: input.externalReference,
          ...(input.callbackSuccessUrl
            ? {
                callback: {
                  successUrl: input.callbackSuccessUrl,
                  autoRedirect: true,
                },
              }
            : {}),
        },
      },
    );

    const firstPayment = await this.findFirstPayment(subscription.id);

    return {
      gatewaySubscriptionId: subscription.id,
      status: subscription.status,
      checkoutUrl: firstPayment?.invoiceUrl,
      firstPaymentId: firstPayment?.id,
    };
  }

  async cancelSubscription(gatewaySubscriptionId: string): Promise<void> {
    await this.request(`/subscriptions/${gatewaySubscriptionId}`, {
      method: "DELETE",
    });
  }

  // Pix Automático's "Jornada 3": the authorization is created together with
  // an immediate charge (immediateQrCode) that both collects the first
  // payment and registers the payer's recurring consent. paymentCreationMode
  // SUBSCRIPTION tells Asaas to keep generating the following charges by
  // itself from then on, mirroring how a card subscription auto-renews once
  // the card is tokenized on first payment.
  async createPixAutomaticAuthorization(
    input: CreatePixAutomaticAuthorizationInput,
  ): Promise<CreatePixAutomaticAuthorizationResult> {
    const authorization =
      await this.request<AsaasPixAutomaticAuthorizationResponse>(
        "/pix/automatic/authorizations",
        {
          method: "POST",
          body: {
            customerId: input.gatewayCustomerId,
            frequency: input.frequency,
            contractId: input.contractId,
            startDate: input.startDate,
            value: input.value,
            description: input.description,
            paymentCreationMode: "SUBSCRIPTION",
            immediateQrCode: {
              originalValue: input.firstChargeValue ?? input.value,
              expirationSeconds: 3600,
              description: input.description,
            },
          },
        },
      );

    return {
      pixAutomaticAuthorizationId: authorization.id,
      status: authorization.status,
      qrCodePayload: authorization.payload,
      qrCodeImage: authorization.encodedImage,
    };
  }

  async cancelPixAutomaticAuthorization(
    pixAutomaticAuthorizationId: string,
  ): Promise<void> {
    await this.request(
      `/pix/automatic/authorizations/${pixAutomaticAuthorizationId}`,
      { method: "DELETE" },
    );
  }

  // Pix transfers to an external key move the exact `value` requested to
  // the destination — Pix doesn't support skimming a fee off the amount in
  // transit. Asaas' transferFee is charged separately against the sending
  // account's own balance, so the recipient (our referrer) always receives
  // the full amount; Vaulto absorbs the fee.
  async createPixTransfer(
    input: CreatePixTransferInput,
  ): Promise<CreatePixTransferResult> {
    const transfer = await this.request<AsaasTransferResponse>("/transfers", {
      method: "POST",
      body: {
        value: input.value,
        pixAddressKey: input.pixAddressKey,
        pixAddressKeyType: input.pixAddressKeyType,
        operationType: "PIX",
        description: input.description,
        externalReference: input.externalReference,
      },
    });

    return {
      gatewayTransferId: transfer.id,
      status: transfer.status,
      failReason: transfer.failReason,
    };
  }

  private async findFirstPayment(
    gatewaySubscriptionId: string,
  ): Promise<{ id: string; invoiceUrl?: string } | undefined> {
    const result = await this.request<AsaasPaymentListResponse>(
      `/payments?subscription=${gatewaySubscriptionId}&limit=1`,
      { method: "GET" },
    );

    return result.data[0];
  }

  async updatePaymentValue(
    gatewayPaymentId: string,
    value: number,
  ): Promise<void> {
    await this.request(`/payments/${gatewayPaymentId}`, {
      method: "PUT",
      body: { value },
    });
  }

  async lookupPixKey(input: LookupPixKeyInput): Promise<LookupPixKeyResult> {
    const query = new URLSearchParams({
      type: input.pixKeyType,
      key: input.pixKey,
    });

    const result = await this.request<AsaasPixKeyLookupResponse>(
      `/pix/addressKeys/external?${query.toString()}`,
      { method: "GET" },
    );

    return {
      bankName:
        result.financialInstitution?.bank?.name ??
        result.financialInstitution?.name ??
        result.ispbName ??
        "",
      ownerName: result.owner?.name ?? "",
      ownerDocument: result.owner?.cpfCnpj ?? "",
    };
  }

  private async request<TResponse>(
    path: string,
    options: { method: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown },
  ): Promise<TResponse> {
    if (!this.apiKey) {
      throw AppException.from(
        APP_ERRORS.billing.gatewayNotConfigured,
        undefined,
      );
    }

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          access_token: this.apiKey,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha de rede ao chamar a Asaas (${path}): ${message}`,
      );
      throw AppException.from(
        APP_ERRORS.billing.gatewayRequestFailed,
        undefined,
      );
    }

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      this.logger.error(
        `Erro da API Asaas em ${path} (status ${response.status}): ${JSON.stringify(payload)}`,
      );
      throw AppException.from(
        APP_ERRORS.billing.gatewayRequestFailed,
        undefined,
      );
    }

    return payload as TResponse;
  }
}
