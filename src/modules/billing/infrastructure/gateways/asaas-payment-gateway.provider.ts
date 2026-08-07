import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import type {
  CreateGatewayCustomerInput,
  CreateGatewayCustomerResult,
  CreateGatewaySubscriptionInput,
  CreateGatewaySubscriptionResult,
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
  data: Array<{ invoiceUrl?: string }>;
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
          cycle: "MONTHLY",
          description: input.description,
          externalReference: input.externalReference,
        },
      },
    );

    const checkoutUrl = await this.findFirstPaymentInvoiceUrl(subscription.id);

    return {
      gatewaySubscriptionId: subscription.id,
      status: subscription.status,
      checkoutUrl,
    };
  }

  private async findFirstPaymentInvoiceUrl(
    gatewaySubscriptionId: string,
  ): Promise<string | undefined> {
    const result = await this.request<AsaasPaymentListResponse>(
      `/payments?subscription=${gatewaySubscriptionId}&limit=1`,
      { method: "GET" },
    );

    return result.data[0]?.invoiceUrl;
  }

  private async request<TResponse>(
    path: string,
    options: { method: "GET" | "POST"; body?: unknown },
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
