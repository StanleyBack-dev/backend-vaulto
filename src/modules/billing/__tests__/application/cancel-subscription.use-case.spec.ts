import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CancelSubscriptionUseCase } from "@/modules/billing/application/use-cases/update/cancel-subscription.use-case";
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

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

  const paymentGateway = {
    cancelSubscription: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new CancelSubscriptionUseCase(
    authorizationService as never,
    subscriptionRepository as never,
    paymentGateway as never,
  );

  return {
    useCase,
    authorizationService,
    subscriptionRepository,
    paymentGateway,
  };
}

describe("CancelSubscriptionUseCase", () => {
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

    await useCase.execute("user-1");

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

  it("downgrades to FREE immediately when the period already lapsed", async () => {
    const currentPeriodEnd = new Date(Date.now() - 1000);
    const { useCase, subscriptionRepository } = buildUseCase({
      subscription: proSubscription({ currentPeriodEnd }),
    });

    await useCase.execute("user-1");

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      },
    );
  });

  it("downgrades to FREE immediately when there is no currentPeriodEnd or trialEndsAt", async () => {
    const { useCase, subscriptionRepository } = buildUseCase({
      subscription: proSubscription(),
    });

    await useCase.execute("user-1");

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
    const { useCase, paymentGateway, subscriptionRepository } = buildUseCase({
      subscription: proSubscription({
        gatewaySubscriptionId: undefined,
        trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    });

    await useCase.execute("user-1");

    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      { cancelAtPeriodEnd: true },
    );
  });

  it("rejects when the user has no Pro subscription", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      subscription: proSubscription({ plan: SubscriptionPlan.FREE }),
    });

    await expect(useCase.execute("user-1")).rejects.toBeInstanceOf(
      AppException,
    );
    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
  });

  it("rejects when there is no subscription at all", async () => {
    const { useCase } = buildUseCase({ subscription: null });

    await expect(useCase.execute("user-1")).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects when cancellation was already scheduled", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      subscription: proSubscription({ cancelAtPeriodEnd: true }),
    });

    await expect(useCase.execute("user-1")).rejects.toBeInstanceOf(
      AppException,
    );
    expect(paymentGateway.cancelSubscription).not.toHaveBeenCalled();
  });
});
