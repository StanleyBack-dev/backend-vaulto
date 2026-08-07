import { AppException } from "@/common/exceptions/app-exception";
import { AsaasPaymentGatewayProvider } from "@/modules/billing/infrastructure/gateways/asaas-payment-gateway.provider";

function buildConfigService(
  overrides: Record<string, string | undefined> = {},
) {
  const values: Record<string, string | undefined> = {
    ASAAS_API_KEY: "test-api-key",
    ASAAS_ENVIRONMENT: "sandbox",
    ...overrides,
  };

  return { get: jest.fn((key: string) => values[key]) };
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("AsaasPaymentGatewayProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("creates a customer against the sandbox base URL with the access_token header", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ id: "cus_123" }));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    const result = await provider.createCustomer({
      name: "Jane Doe",
      email: "jane@example.com",
      cpfCnpj: "12345678900",
      externalReference: "user-1",
    });

    expect(result).toEqual({ gatewayCustomerId: "cus_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-sandbox.asaas.com/v3/customers",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ access_token: "test-api-key" }),
      }),
    );
  });

  it("uses the production base URL when ASAAS_ENVIRONMENT is production", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ id: "cus_123" }));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService({ ASAAS_ENVIRONMENT: "production" }) as never,
    );

    await provider.createCustomer({
      name: "Jane Doe",
      email: "jane@example.com",
      cpfCnpj: "12345678900",
      externalReference: "user-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.asaas.com/v3/customers",
      expect.anything(),
    );
  });

  it("creates a subscription and resolves the checkout URL from the first payment", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "sub_123", status: "ACTIVE" }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ invoiceUrl: "https://asaas.com/i/abc123" }],
        }),
      );
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    const result = await provider.createSubscription({
      gatewayCustomerId: "cus_123",
      value: 14.9,
      nextDueDate: "2026-08-15",
      description: "Vaulto Pro",
      externalReference: "user-1",
    });

    expect(result).toEqual({
      gatewaySubscriptionId: "sub_123",
      status: "ACTIVE",
      checkoutUrl: "https://asaas.com/i/abc123",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api-sandbox.asaas.com/v3/payments?subscription=sub_123&limit=1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rejects with a gateway error when the API key is missing", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService({ ASAAS_API_KEY: undefined }) as never,
    );

    await expect(
      provider.createCustomer({
        name: "Jane Doe",
        email: "jane@example.com",
        cpfCnpj: "12345678900",
        externalReference: "user-1",
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects with a gateway error when Asaas responds with a non-ok status", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ errors: [{ description: "invalid" }] }, false, 400),
      ) as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await expect(
      provider.createCustomer({
        name: "Jane Doe",
        email: "jane@example.com",
        cpfCnpj: "12345678900",
        externalReference: "user-1",
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects with a gateway error when the network request throws", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("network down")) as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await expect(
      provider.createCustomer({
        name: "Jane Doe",
        email: "jane@example.com",
        cpfCnpj: "12345678900",
        externalReference: "user-1",
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
