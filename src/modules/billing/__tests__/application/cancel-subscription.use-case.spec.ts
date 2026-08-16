import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CancelSubscriptionUseCase } from "@/modules/billing/application/use-cases/update/cancel-subscription.use-case";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

function proSubscription(overrides: Record<string, unknown> = {}) {
  return {
    idSubscription: "subscription-1",
    idUsers: "user-1",
    plan: SubscriptionPlan.PRO,
    status: SubscriptionStatus.ACTIVE,
    cancelAtPeriodEnd: false,
    gatewaySubscriptionId: "sub_123",
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    proStartedAt: new Date("2026-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const reasons = [CancellationReason.TOO_EXPENSIVE];

function buildUseCase(
  overrides: { subscription?: Record<string, unknown> | null } = {},
) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const subscriptionRepository = {
    findByUserId: jest
      .fn()
      .mockResolvedValue(
        overrides.subscription === undefined
          ? proSubscription()
          : overrides.subscription,
      ),
    updateByUserId: jest.fn().mockResolvedValue(proSubscription()),
  };

  const subscriptionCancellationRepository = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const paymentGateway = {
    cancelSubscription: jest.fn().mockResolvedValue(undefined),
    cancelPixAutomaticAuthorization: jest.fn().mockResolvedValue(undefined),
  };

  const subscriptionCanceledNotificationEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOne: jest
      .fn()
      .mockResolvedValue({ name: "Stanley", email: "stanley@example.com" }),
  };

  const useCase = new CancelSubscriptionUseCase(
    authorizationService as never,
    subscriptionRepository as never,
    subscriptionCancellationRepository as never,
    paymentGateway as never,
    subscriptionCanceledNotificationEmailUseCase as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    subscriptionRepository,
    subscriptionCancellationRepository,
    paymentGateway,
    subscriptionCanceledNotificationEmailUseCase,
    userRepository,
  };
}

describe("CancelSubscriptionUseCase", () => {
  it("rejects when no reason is selected", async () => {
    const { useCase, subscriptionRepository } = buildUseCase();

    await expect(
      useCase.execute("user-1", { reasons: [] }),
    ).rejects.toBeInstanceOf(AppException);
    expect(subscriptionRepository.findByUserId).not.toHaveBeenCalled();
  });

  it("cancels the gateway subscription and keeps Pro until currentPeriodEnd", async () => {
    const currentPeriodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const {
      useCase,
      authorizationService,
      subscriptionRepository,
      paymentGateway,
    } = buildUseCase({
      subscription: proSubscription({ currentPeriodEnd }),
    });

    await useCase.execute("user-1", { reasons });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_PROFILE,
    );
    expect(paymentGateway.cancelSubscription).toHaveBeenCalledWith("sub_123");
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      { cancelAtPeriodEnd: true },
    );
  });

  it("persists the survey and notifies the company before returning", async () => {
    const currentPeriodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const {
      useCase,
      subscriptionCancellationRepository,
      subscriptionCanceledNotificationEmailUseCase,
    } = buildUseCase({
      subscription: proSubscription({ currentPeriodEnd }),
    });

    await useCase.execute("user-1", {
      reasons,
      otherReason: "Não uso mais",
    });

    expect(subscriptionCancellationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        reasons,
        otherReason: "Não uso mais",
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      }),
    );
    expect(
      subscriptionCanceledNotificationEmailUseCase.send,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: "Stanley",
        userEmail: "stanley@example.com",
        reasons,
      }),
    );
  });

  it("downgrades to FREE immediately when the period already lapsed", async () => {
    const currentPeriodEnd = new Date(Date.now() - 1000);
    const { useCase, subscriptionRepository } = buildUseCase({
      subscription: proSubscription({ currentPeriodEnd }),
    });

    await useCase.execute("user-1", { reasons });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      },
    );
  });

  it("downgrades to FREE immediately when there is no currentPeriodEnd", async () => {
    const { useCase, subscriptionRepository } = buildUseCase({
      subscription: proSubscription(),
    });

    await useCase.execute("user-1", { reasons });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      },
    );
  });

  it("does not call the gateway when the subscription has no gatewaySubscriptionId", async () => {
    const currentPeriodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { useCase, paymentGateway, subscriptionRepository } = buildUseCase({
      subscription: proSubscription({
        gatewaySubscriptionId: undefined,
        currentPeriodEnd,
      }),
    });

    await useCase.execute("user-1", { reasons });

    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      { cancelAtPeriodEnd: true },
    );
  });

  it("cancels the Pix Automático authorization when gatewayPixAuthorizationId is set", async () => {
    const currentPeriodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const { useCase, paymentGateway } = buildUseCase({
      subscription: proSubscription({
        gatewaySubscriptionId: undefined,
        gatewayPixAuthorizationId: "aut_123",
        currentPeriodEnd,
      }),
    });

    await useCase.execute("user-1", { reasons });

    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
    expect(paymentGateway.cancelPixAutomaticAuthorization).toHaveBeenCalledWith(
      "aut_123",
    );
  });

  it("rejects when the user has no Pro subscription", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      subscription: proSubscription({ plan: SubscriptionPlan.FREE }),
    });

    await expect(useCase.execute("user-1", { reasons })).rejects.toBeInstanceOf(
      AppException,
    );
    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects when there is no subscription at all", async () => {
    const { useCase } = buildUseCase({ subscription: null });

    await expect(useCase.execute("user-1", { reasons })).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects when cancellation was already scheduled", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      subscription: proSubscription({ cancelAtPeriodEnd: true }),
    });

    await expect(useCase.execute("user-1", { reasons })).rejects.toBeInstanceOf(
      AppException,
    );
    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
  });
});
