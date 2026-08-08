import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { SubscribeToProUseCase } from "@/modules/billing/application/use-cases/create/subscribe-to-pro.use-case";
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
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.TRIALING,
      gatewayCustomerId: "cus_123",
      gatewaySubscriptionId: "sub_123",
    });

  const subscriptionRepository = {
    findByUserId: jest.fn(),
    findByGatewaySubscriptionId: jest.fn(),
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
    }),
  };

  const userRepository = {
    findOne: jest.fn().mockResolvedValue({
      idUsers: "user-1",
      name: "Jane Doe",
      email: "jane@example.com",
    }),
  };

  const useCase = new SubscribeToProUseCase(
    authorizationService as never,
    createDefaultSubscriptionUseCase as never,
    subscriptionRepository as never,
    paymentGateway as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    createDefaultSubscriptionUseCase,
    subscriptionRepository,
    paymentGateway,
    userRepository,
  };
}

describe("SubscribeToProUseCase", () => {
  it("creates a gateway customer, a monthly subscription and updates the local subscription to TRIALING", async () => {
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
        value: 14.9,
        cycle: SubscriptionBillingCycle.MONTHLY,
        externalReference: "user-1",
      }),
    );
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        status: SubscriptionStatus.TRIALING,
        billingCycle: SubscriptionBillingCycle.MONTHLY,
        gatewayCustomerId: "cus_123",
        gatewaySubscriptionId: "sub_123",
      }),
    );
    expect(result.checkoutUrl).toBe("https://asaas.com/i/abc123");
  });

  it("charges the annual price and cycle when billingCycle is YEARLY", async () => {
    const { useCase, paymentGateway } = buildUseCase();

    await useCase.execute("user-1", {
      cpfCnpj: "12345678900",
      billingCycle: SubscriptionBillingCycle.YEARLY,
    });

    expect(paymentGateway.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 149.9,
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

  it("rejects when the user already has an active or trialing Pro subscription", async () => {
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
});
