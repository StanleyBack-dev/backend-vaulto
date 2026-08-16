import { RunSubscriptionLifecycleUseCase } from "@/modules/billing/application/use-cases/lifecycle/run-subscription-lifecycle.use-case";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

function subscriptionView(overrides: Record<string, unknown> = {}) {
  return {
    idSubscription: "subscription-1",
    idUsers: "user-1",
    plan: SubscriptionPlan.PRO,
    status: SubscriptionStatus.ACTIVE,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    pastDue?: Record<string, unknown>[];
    pendingCancellations?: Record<string, unknown>[];
  } = {},
) {
  const subscriptionRepository = {
    findByStatus: jest.fn().mockImplementation((status: SubscriptionStatus) => {
      if (status === SubscriptionStatus.PAST_DUE) {
        return Promise.resolve(overrides.pastDue ?? []);
      }
      return Promise.resolve([]);
    }),
    findPendingCancellations: jest
      .fn()
      .mockResolvedValue(overrides.pendingCancellations ?? []),
    updateByUserId: jest.fn().mockResolvedValue(subscriptionView()),
  };

  const useCase = new RunSubscriptionLifecycleUseCase(
    subscriptionRepository as never,
  );

  return { useCase, subscriptionRepository };
}

describe("RunSubscriptionLifecycleUseCase", () => {
  it("downgrades a subscription that has been PAST_DUE for longer than the grace period", async () => {
    const pastDueSince = new Date(Date.now() - 5 * DAY_IN_MS);
    const { useCase, subscriptionRepository } = buildUseCase({
      pastDue: [
        subscriptionView({ status: SubscriptionStatus.PAST_DUE, pastDueSince }),
      ],
    });

    const result = await useCase.execute();

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.EXPIRED,
        pastDueSince: null,
      },
    );
    expect(result.downgradedToFree).toBe(1);
  });

  it("does not downgrade a subscription still within the PAST_DUE grace period", async () => {
    const pastDueSince = new Date(Date.now() - 1 * DAY_IN_MS);
    const { useCase, subscriptionRepository } = buildUseCase({
      pastDue: [
        subscriptionView({ status: SubscriptionStatus.PAST_DUE, pastDueSince }),
      ],
    });

    const result = await useCase.execute();

    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
    expect(result.downgradedToFree).toBe(0);
  });

  it("downgrades a pending cancellation once currentPeriodEnd has passed", async () => {
    const currentPeriodEnd = new Date(Date.now() - 1 * HOUR_IN_MS);
    const { useCase, subscriptionRepository } = buildUseCase({
      pendingCancellations: [
        subscriptionView({
          status: SubscriptionStatus.ACTIVE,
          cancelAtPeriodEnd: true,
          currentPeriodEnd,
        }),
      ],
    });

    const result = await useCase.execute();

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      },
    );
    expect(result.downgradedToFree).toBe(1);
  });

  it("does not downgrade a pending cancellation before currentPeriodEnd", async () => {
    const currentPeriodEnd = new Date(Date.now() + 1 * DAY_IN_MS);
    const { useCase, subscriptionRepository } = buildUseCase({
      pendingCancellations: [
        subscriptionView({
          status: SubscriptionStatus.ACTIVE,
          cancelAtPeriodEnd: true,
          currentPeriodEnd,
        }),
      ],
    });

    const result = await useCase.execute();

    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
    expect(result.downgradedToFree).toBe(0);
  });

  it("does not downgrade a pending cancellation with no currentPeriodEnd recorded", async () => {
    const { useCase, subscriptionRepository } = buildUseCase({
      pendingCancellations: [
        subscriptionView({
          status: SubscriptionStatus.ACTIVE,
          cancelAtPeriodEnd: true,
        }),
      ],
    });

    const result = await useCase.execute();

    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
    expect(result.downgradedToFree).toBe(0);
  });
});
