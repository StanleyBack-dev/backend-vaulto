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
    status: SubscriptionStatus.TRIALING,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    trialing?: Record<string, unknown>[];
    pastDue?: Record<string, unknown>[];
    user?: Record<string, unknown> | null;
  } = {},
) {
  const subscriptionRepository = {
    findByStatus: jest.fn().mockImplementation((status: SubscriptionStatus) => {
      if (status === SubscriptionStatus.TRIALING) {
        return Promise.resolve(overrides.trialing ?? []);
      }
      if (status === SubscriptionStatus.PAST_DUE) {
        return Promise.resolve(overrides.pastDue ?? []);
      }
      return Promise.resolve([]);
    }),
    updateByUserId: jest.fn().mockResolvedValue(subscriptionView()),
  };

  const subscriptionTrialEndingEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOne: jest
      .fn()
      .mockResolvedValue(
        overrides.user === undefined
          ? { idUsers: "user-1", email: "user@example.com", name: "User" }
          : overrides.user,
      ),
  };

  const useCase = new RunSubscriptionLifecycleUseCase(
    subscriptionRepository as never,
    subscriptionTrialEndingEmailUseCase as never,
    userRepository as never,
  );

  return {
    useCase,
    subscriptionRepository,
    subscriptionTrialEndingEmailUseCase,
    userRepository,
  };
}

describe("RunSubscriptionLifecycleUseCase", () => {
  it("sends the trial ending reminder for a trial ending within the reminder window", async () => {
    const trialEndsAt = new Date(Date.now() + 20 * HOUR_IN_MS);
    const {
      useCase,
      subscriptionTrialEndingEmailUseCase,
      subscriptionRepository,
    } = buildUseCase({
      trialing: [subscriptionView({ trialEndsAt })],
    });

    const result = await useCase.execute();

    expect(subscriptionTrialEndingEmailUseCase.send).toHaveBeenCalledWith({
      to: "user@example.com",
      name: "User",
      trialEndsAt,
    });
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      { trialEndingNotifiedAt: expect.any(Date) },
    );
    expect(result.trialRemindersSent).toBe(1);
  });

  it("does not send the reminder again once trialEndingNotifiedAt is already set", async () => {
    const trialEndsAt = new Date(Date.now() + 20 * HOUR_IN_MS);
    const { useCase, subscriptionTrialEndingEmailUseCase } = buildUseCase({
      trialing: [
        subscriptionView({ trialEndsAt, trialEndingNotifiedAt: new Date() }),
      ],
    });

    const result = await useCase.execute();

    expect(subscriptionTrialEndingEmailUseCase.send).not.toHaveBeenCalled();
    expect(result.trialRemindersSent).toBe(0);
  });

  it("does not send the reminder for a trial ending outside the reminder window", async () => {
    const trialEndsAt = new Date(Date.now() + 5 * DAY_IN_MS);
    const { useCase, subscriptionTrialEndingEmailUseCase } = buildUseCase({
      trialing: [subscriptionView({ trialEndsAt })],
    });

    const result = await useCase.execute();

    expect(subscriptionTrialEndingEmailUseCase.send).not.toHaveBeenCalled();
    expect(result.trialRemindersSent).toBe(0);
  });

  it("downgrades a trial that ended more than the grace period ago and was never confirmed", async () => {
    const staleTrialEndsAt = new Date(Date.now() - 5 * DAY_IN_MS);
    const { useCase, subscriptionRepository } = buildUseCase({
      trialing: [subscriptionView({ trialEndsAt: staleTrialEndsAt })],
    });

    const result = await useCase.execute();

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.EXPIRED },
    );
    expect(result.downgradedToFree).toBe(1);
  });

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

  it("skips subscriptions without a user record", async () => {
    const trialEndsAt = new Date(Date.now() + 20 * HOUR_IN_MS);
    const { useCase, subscriptionTrialEndingEmailUseCase } = buildUseCase({
      trialing: [subscriptionView({ trialEndsAt })],
      user: null,
    });

    const result = await useCase.execute();

    expect(subscriptionTrialEndingEmailUseCase.send).not.toHaveBeenCalled();
    expect(result.trialRemindersSent).toBe(0);
  });
});
