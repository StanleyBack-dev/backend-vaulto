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
      cycle: "MONTHLY",
      description: "Vaulto Pro",
      externalReference: "user-1",
    });

    expect(result).toEqual({
      gatewaySubscriptionId: "sub_123",
      status: "ACTIVE",
      checkoutUrl: "https://asaas.com/i/abc123",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api-sandbox.asaas.com/v3/subscriptions",
      expect.objectContaining({
        body: expect.stringContaining('"cycle":"MONTHLY"'),
      }),
    );
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

  it("cancels a subscription with a DELETE request", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({}));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await provider.cancelSubscription("sub_123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-sandbox.asaas.com/v3/subscriptions/sub_123",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("creates a Pix Automático authorization with an immediate QR Code and subscription mode", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        id: "aut_123",
        status: "CREATED",
        payload: "00020126...",
        encodedImage: "data:image/png;base64,abc",
      }),
    );
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    const result = await provider.createPixAutomaticAuthorization({
      gatewayCustomerId: "cus_123",
      value: 14.9,
      frequency: "MONTHLY",
      contractId: "user1",
      startDate: "2026-08-16",
      description: "Vaulto Pro",
    });

    expect(result).toEqual({
      pixAutomaticAuthorizationId: "aut_123",
      status: "CREATED",
      qrCodePayload: "00020126...",
      qrCodeImage: "data:image/png;base64,abc",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api-sandbox.asaas.com/v3/pix/automatic/authorizations",
    );
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      customerId: "cus_123",
      frequency: "MONTHLY",
      contractId: "user1",
      startDate: "2026-08-16",
      value: 14.9,
      paymentCreationMode: "SUBSCRIPTION",
      immediateQrCode: expect.objectContaining({ originalValue: 14.9 }),
    });
  });

  it("cancels a Pix Automático authorization with a DELETE request", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({}));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await provider.cancelPixAutomaticAuthorization("aut_123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-sandbox.asaas.com/v3/pix/automatic/authorizations/aut_123",
      expect.objectContaining({ method: "DELETE" }),
    );
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
