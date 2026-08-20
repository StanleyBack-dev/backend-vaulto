import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { SubscribeToProUseCase } from "@/modules/billing/application/use-cases/create/subscribe-to-pro.use-case";
import {
  PRO_PLAN_FIRST_MONTH_PRICE,
  PRO_PLAN_PRICES,
} from "@/modules/billing/domain/constants/pro-plan.constant";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

function freeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    idSubscription: "subscription-1",
    idUsers: "user-1",
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.ACTIVE,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    subscription?: Record<string, unknown>;
    updatedSubscription?: Record<string, unknown>;
  } = {},
) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const subscription = overrides.subscription ?? freeSubscription();

  const createDefaultSubscriptionUseCase = {
    execute: jest.fn().mockResolvedValue(subscription),
  };

  const updatedSubscription =
    overrides.updatedSubscription ??
    freeSubscription({
      gatewayCustomerId: "cus_123",
      gatewaySubscriptionId: "sub_123",
    });

  const subscriptionRepository = {
    findByUserId: jest.fn(),
    findByGatewaySubscriptionId: jest.fn(),
    findByGatewayPixAuthorizationId: jest.fn(),
    updateByUserId: jest.fn().mockResolvedValue(updatedSubscription),
  };

  const paymentGateway = {
    createCustomer: jest
      .fn()
      .mockResolvedValue({ gatewayCustomerId: "cus_123" }),
    createSubscription: jest.fn().mockResolvedValue({
      gatewaySubscriptionId: "sub_123",
      status: "ACTIVE",
      checkoutUrl: "https://asaas.com/i/abc123",
      firstPaymentId: "pay_123",
    }),
    createPixAutomaticAuthorization: jest.fn().mockResolvedValue({
      pixAutomaticAuthorizationId: "aut_123",
      status: "CREATED",
      qrCodePayload: "00020126...",
      qrCodeImage: "data:image/png;base64,abc",
    }),
    updatePaymentValue: jest.fn().mockResolvedValue(undefined),
  };

  const proLeadEventRepository = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOne: jest.fn().mockResolvedValue({
      idUsers: "user-1",
      name: "Jane Doe",
      email: "jane@example.com",
    }),
  };

  const configService = {
    get: jest.fn().mockReturnValue("https://app.vaulto.com.br"),
  };

  const useCase = new SubscribeToProUseCase(
    authorizationService as never,
    createDefaultSubscriptionUseCase as never,
    subscriptionRepository as never,
    paymentGateway as never,
    proLeadEventRepository as never,
    userRepository as never,
    configService as never,
  );

  return {
    useCase,
    authorizationService,
    createDefaultSubscriptionUseCase,
    subscriptionRepository,
    paymentGateway,
    proLeadEventRepository,
    userRepository,
    configService,
  };
}

describe("SubscribeToProUseCase", () => {
  it("creates a gateway customer, a monthly subscription and charges it immediately", async () => {
    const {
      useCase,
      authorizationService,
      subscriptionRepository,
      paymentGateway,
    } = buildUseCase();

    const result = await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.MONTHLY,
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_PROFILE,
    );
    expect(paymentGateway.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Doe",
        email: "jane@example.com",
        cpfCnpj: "12345678900",
        externalReference: "user-1",
      }),
    );
    expect(paymentGateway.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayCustomerId: "cus_123",
        value: PRO_PLAN_PRICES[SubscriptionBillingCycle.MONTHLY],
        nextDueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        cycle: SubscriptionBillingCycle.MONTHLY,
        externalReference: "user-1",
        callbackSuccessUrl: "https://app.vaulto.com.br/planos",
      }),
    );
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        gatewayCustomerId: "cus_123",
        gatewaySubscriptionId: "sub_123",
      }),
    );
    expect(result.checkoutUrl).toBe("https://asaas.com/i/abc123");
  });

  it("falls back to localhost for the callback success URL when FRONTEND_URL is unset", async () => {
    const { useCase, paymentGateway, configService } = buildUseCase();
    configService.get.mockReturnValue(undefined);

    await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.MONTHLY,
    });

    expect(paymentGateway.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackSuccessUrl: "http://localhost:3000/planos",
      }),
    );
  });

  it("charges the annual price and cycle when billingCycle is YEARLY", async () => {
    const { useCase, paymentGateway } = buildUseCase();

    await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.YEARLY,
    });

    expect(paymentGateway.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        value: PRO_PLAN_PRICES[SubscriptionBillingCycle.YEARLY],
        cycle: SubscriptionBillingCycle.YEARLY,
      }),
    );
  });

  it("reuses an existing gateway customer id instead of creating a new one", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      subscription: freeSubscription({ gatewayCustomerId: "cus_existing" }),
    });

    await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.MONTHLY,
    });

    expect(paymentGateway.createCustomer).not.toHaveBeenCalled();
    expect(paymentGateway.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayCustomerId: "cus_existing" }),
    );
  });

  it("rejects when the user already has an active Pro subscription", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      subscription: freeSubscription({
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      }),
    });

    await expect(
      useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(paymentGateway.createCustomer).not.toHaveBeenCalled();
  });

  it("persists the newly created gateway customer id even if createSubscription then fails", async () => {
    const { useCase, subscriptionRepository, paymentGateway } = buildUseCase();
    paymentGateway.createSubscription.mockRejectedValue(
      new Error("Asaas rejected the subscription"),
    );

    await expect(
      useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      }),
    ).rejects.toThrow("Asaas rejected the subscription");

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      { gatewayCustomerId: "cus_123" },
    );
  });

  it("records a CHECKOUT_REACHED lead event after a checkout subscription is created", async () => {
    const { useCase, proLeadEventRepository } = buildUseCase();

    await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.MONTHLY,
    });

    expect(proLeadEventRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        email: "jane@example.com",
        name: "Jane Doe",
        event: "CHECKOUT_REACHED",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        checkoutUrl: "https://asaas.com/i/abc123",
        gatewaySubscriptionId: "sub_123",
      }),
    );
  });

  it("does not let a lead-tracking failure block the checkout subscription", async () => {
    const { useCase, proLeadEventRepository } = buildUseCase();
    proLeadEventRepository.record.mockRejectedValue(new Error("db down"));

    const result = await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.MONTHLY,
    });

    expect(result.checkoutUrl).toBe("https://asaas.com/i/abc123");
  });

  it("rejects when the authenticated user cannot be found", async () => {
    const { useCase, userRepository } = buildUseCase();
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  describe("pixAutomatic", () => {
    it("creates a Pix Automático authorization instead of a checkout subscription", async () => {
      const { useCase, subscriptionRepository, paymentGateway } = buildUseCase({
        updatedSubscription: freeSubscription({
          gatewayCustomerId: "cus_123",
          gatewayPixAuthorizationId: "aut_123",
        }),
      });

      const result = await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        pixAutomatic: true,
      });

      expect(paymentGateway.createSubscription).not.toHaveBeenCalled();
      expect(
        paymentGateway.createPixAutomaticAuthorization,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          gatewayCustomerId: "cus_123",
          value: PRO_PLAN_PRICES[SubscriptionBillingCycle.MONTHLY],
          frequency: "MONTHLY",
          contractId: "user1",
          startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
      expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          gatewayCustomerId: "cus_123",
          gatewayPixAuthorizationId: "aut_123",
        }),
      );
      expect(result.checkoutUrl).toBeUndefined();
      expect(result.pixQrCode).toEqual({
        payload: "00020126...",
        image: "data:image/png;base64,abc",
      });
    });

    it("maps YEARLY billing cycle to the ANNUALLY Pix frequency", async () => {
      const { useCase, paymentGateway } = buildUseCase();

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.YEARLY,
        pixAutomatic: true,
      });

      expect(
        paymentGateway.createPixAutomaticAuthorization,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: "ANNUALLY" }),
      );
    });

    it("strips hyphens from the user id to build a valid contractId", async () => {
      const { useCase, paymentGateway } = buildUseCase({
        subscription: freeSubscription({
          idUsers: "11111111-2222-3333-4444-555555555555",
        }),
      });

      await useCase.execute("11111111-2222-3333-4444-555555555555", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        pixAutomatic: true,
      });

      expect(
        paymentGateway.createPixAutomaticAuthorization,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: "11111111222233334444555555555555",
        }),
      );
    });
  });

  describe("first-month discount", () => {
    it("overrides the first checkout invoice's value for an account that has never been Pro before", async () => {
      const { useCase, paymentGateway } = buildUseCase();

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      });

      expect(paymentGateway.updatePaymentValue).toHaveBeenCalledWith(
        "pay_123",
        PRO_PLAN_FIRST_MONTH_PRICE,
      );
    });

    it("does not discount a checkout subscription for an account that was Pro before", async () => {
      const { useCase, paymentGateway } = buildUseCase({
        subscription: freeSubscription({ proStartedAt: new Date() }),
      });

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      });

      expect(paymentGateway.updatePaymentValue).not.toHaveBeenCalled();
    });

    it("does not discount a yearly checkout subscription", async () => {
      const { useCase, paymentGateway } = buildUseCase();

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.YEARLY,
      });

      expect(paymentGateway.updatePaymentValue).not.toHaveBeenCalled();
    });

    it("skips the discount call when the gateway didn't return a first payment id", async () => {
      const { useCase, paymentGateway } = buildUseCase();
      paymentGateway.createSubscription.mockResolvedValue({
        gatewaySubscriptionId: "sub_123",
        status: "ACTIVE",
        checkoutUrl: "https://asaas.com/i/abc123",
      });

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      });

      expect(paymentGateway.updatePaymentValue).not.toHaveBeenCalled();
    });

    it("passes firstChargeValue to Pix Automático for an account that has never been Pro before", async () => {
      const { useCase, paymentGateway } = buildUseCase();

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        pixAutomatic: true,
      });

      expect(
        paymentGateway.createPixAutomaticAuthorization,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          firstChargeValue: PRO_PLAN_FIRST_MONTH_PRICE,
        }),
      );
    });

    it("does not pass firstChargeValue to Pix Automático for an account that was Pro before", async () => {
      const { useCase, paymentGateway } = buildUseCase({
        subscription: freeSubscription({ proStartedAt: new Date() }),
      });

      await useCase.execute("user-1", {
        cpfCnpj: "12345678900",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        pixAutomatic: true,
      });

      const call = paymentGateway.createPixAutomaticAuthorization.mock
        .calls[0][0] as Record<string, unknown>;
      expect(call.firstChargeValue).toBeUndefined();
    });
  });
});
