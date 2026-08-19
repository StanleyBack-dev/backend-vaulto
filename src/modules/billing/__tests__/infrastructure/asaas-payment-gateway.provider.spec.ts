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

  it("returns the first payment id alongside the checkout URL", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "sub_123", status: "ACTIVE" }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "pay_123", invoiceUrl: "https://asaas.com/i/abc123" }],
        }),
      );
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    const result = await provider.createSubscription({
      gatewayCustomerId: "cus_123",
      value: 29.9,
      nextDueDate: "2026-08-15",
      cycle: "MONTHLY",
      description: "Vaulto Pro",
      externalReference: "user-1",
    });

    expect(result.firstPaymentId).toBe("pay_123");
  });

  it("updates a payment's value with a PUT request", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ id: "pay_123" }));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await provider.updatePaymentValue("pay_123", 19.9);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-sandbox.asaas.com/v3/payments/pay_123",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ value: 19.9 }),
      }),
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

  it("includes a callback with autoRedirect when callbackSuccessUrl is provided", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "sub_123", status: "ACTIVE" }))
      .mockResolvedValueOnce(jsonResponse({ data: [] }));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await provider.createSubscription({
      gatewayCustomerId: "cus_123",
      value: 14.9,
      nextDueDate: "2026-08-15",
      cycle: "MONTHLY",
      description: "Vaulto Pro",
      externalReference: "user-1",
      callbackSuccessUrl: "https://app.vaulto.com.br/planos",
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.callback).toEqual({
      successUrl: "https://app.vaulto.com.br/planos",
      autoRedirect: true,
    });
  });

  it("omits the callback field when callbackSuccessUrl is not provided", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "sub_123", status: "ACTIVE" }))
      .mockResolvedValueOnce(jsonResponse({ data: [] }));
    global.fetch = fetchMock as never;

    const provider = new AsaasPaymentGatewayProvider(
      buildConfigService() as never,
    );

    await provider.createSubscription({
      gatewayCustomerId: "cus_123",
      value: 14.9,
      nextDueDate: "2026-08-15",
      cycle: "MONTHLY",
      description: "Vaulto Pro",
      externalReference: "user-1",
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.callback).toBeUndefined();
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

  it("uses firstChargeValue for the immediate QR Code when provided, without changing the recurring value", async () => {
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

    await provider.createPixAutomaticAuthorization({
      gatewayCustomerId: "cus_123",
      value: 29.9,
      frequency: "MONTHLY",
      contractId: "user1",
      startDate: "2026-08-16",
      description: "Vaulto Pro",
      firstChargeValue: 19.9,
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body.value).toBe(29.9);
    expect(body.immediateQrCode.originalValue).toBe(19.9);
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

  describe("createPixTransfer", () => {
    it("posts to /transfers with the full requested value and the pix key", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(
          jsonResponse({ id: "transfer_123", status: "DONE" }),
        );
      global.fetch = fetchMock as never;

      const provider = new AsaasPaymentGatewayProvider(
        buildConfigService() as never,
      );

      const result = await provider.createPixTransfer({
        value: 20,
        pixAddressKey: "user@example.com",
        pixAddressKeyType: "EMAIL",
        description: "Saque de indicações Vaulto",
        externalReference: "withdrawal-1",
      });

      expect(result).toEqual({
        gatewayTransferId: "transfer_123",
        status: "DONE",
        failReason: undefined,
      });

      const [, requestOptions] = fetchMock.mock.calls[0];
      const body = JSON.parse(requestOptions.body);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api-sandbox.asaas.com/v3/transfers",
        expect.objectContaining({ method: "POST" }),
      );
      expect(body).toEqual(
        expect.objectContaining({
          value: 20,
          pixAddressKey: "user@example.com",
          pixAddressKeyType: "EMAIL",
          operationType: "PIX",
          externalReference: "withdrawal-1",
        }),
      );
    });

    it("surfaces the gateway's failReason when the transfer fails", async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse({
          id: "transfer_123",
          status: "FAILED",
          failReason: "Chave Pix inválida",
        }),
      ) as never;

      const provider = new AsaasPaymentGatewayProvider(
        buildConfigService() as never,
      );

      const result = await provider.createPixTransfer({
        value: 20,
        pixAddressKey: "invalid-key",
        pixAddressKeyType: "EMAIL",
        description: "Saque de indicações Vaulto",
        externalReference: "withdrawal-1",
      });

      expect(result.status).toBe("FAILED");
      expect(result.failReason).toBe("Chave Pix inválida");
    });

    it("rejects with a gateway error when the Asaas API returns a non-ok response", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          jsonResponse({ errors: [{ description: "invalid" }] }, false, 400),
        ) as never;

      const provider = new AsaasPaymentGatewayProvider(
        buildConfigService() as never,
      );

      await expect(
        provider.createPixTransfer({
          value: 20,
          pixAddressKey: "user@example.com",
          pixAddressKeyType: "EMAIL",
          description: "Saque de indicações Vaulto",
          externalReference: "withdrawal-1",
        }),
      ).rejects.toBeInstanceOf(AppException);
    });
  });

  describe("lookupPixKey", () => {
    it("queries /pix/addressKeys/external with the key and type as query params", async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          ispbName: "ASAAS IP S.A.",
          financialInstitution: {
            name: "Asaas IP",
            bank: { name: "Asaas I.P S.A" },
          },
          owner: { name: "João da Silva", cpfCnpj: "***.516.151-**" },
        }),
      );
      global.fetch = fetchMock as never;

      const provider = new AsaasPaymentGatewayProvider(
        buildConfigService() as never,
      );

      const result = await provider.lookupPixKey({
        pixKeyType: "EVP",
        pixKey: "e1474eb5-c107-4b28-9e3f-dfcb83188874",
      });

      expect(result).toEqual({
        bankName: "Asaas I.P S.A",
        ownerName: "João da Silva",
        ownerDocument: "***.516.151-**",
      });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api-sandbox.asaas.com/v3/pix/addressKeys/external?type=EVP&key=e1474eb5-c107-4b28-9e3f-dfcb83188874",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("falls back to the institution name when no bank name is present", async () => {
      global.fetch = jest.fn().mockResolvedValue(
        jsonResponse({
          ispbName: "ASAAS IP S.A.",
          financialInstitution: { name: "Asaas IP" },
          owner: { name: "João da Silva", cpfCnpj: "***.516.151-**" },
        }),
      ) as never;

      const provider = new AsaasPaymentGatewayProvider(
        buildConfigService() as never,
      );

      const result = await provider.lookupPixKey({
        pixKeyType: "PHONE",
        pixKey: "+5562998500635",
      });

      expect(result.bankName).toBe("Asaas IP");
    });

    it("rejects with a gateway error when the key is not found", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse(undefined, false, 404)) as never;

      const provider = new AsaasPaymentGatewayProvider(
        buildConfigService() as never,
      );

      await expect(
        provider.lookupPixKey({
          pixKeyType: "EVP",
          pixKey: "00000000-0000-4000-8000-000000000000",
        }),
      ).rejects.toBeInstanceOf(AppException);
    });
  });
});
