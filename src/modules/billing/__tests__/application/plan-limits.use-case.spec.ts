import { AppException } from "@/common/exceptions/app-exception";
import { FREE_PLAN_LIMITS } from "@/modules/billing/domain/constants/free-plan-limits.constant";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";

function buildService(
  subscription: unknown,
  group: UserGroup = UserGroup.USER,
) {
  const subscriptionRepository = {
    findByUserId: jest.fn().mockResolvedValue(subscription),
  };
  const userRepository = {
    findOne: jest.fn().mockResolvedValue({ idUsers: "user-1", group }),
  };

  const service = new PlanLimitsService(
    subscriptionRepository as never,
    userRepository as never,
  );

  return { service, subscriptionRepository, userRepository };
}

function freeSubscription() {
  return {
    idSubscription: "subscription-1",
    idUsers: "user-1",
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.ACTIVE,
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("PlanLimitsService", () => {
  it("should allow creation when the current count is below the Free limit", async () => {
    const { service } = buildService(freeSubscription());

    await expect(
      service.assertCanCreate(
        "user-1",
        PlanLimitedResource.DEBTS,
        FREE_PLAN_LIMITS[PlanLimitedResource.DEBTS] - 1,
      ),
    ).resolves.toBeUndefined();
  });

  it("should reject creation when the current count reached the Free limit", async () => {
    const { service } = buildService(freeSubscription());

    await expect(
      service.assertCanCreate(
        "user-1",
        PlanLimitedResource.DEBTS,
        FREE_PLAN_LIMITS[PlanLimitedResource.DEBTS],
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should reject creation when the current count is above the Free limit", async () => {
    const { service } = buildService(freeSubscription());

    await expect(
      service.assertCanCreate(
        "user-1",
        PlanLimitedResource.DEBTS,
        FREE_PLAN_LIMITS[PlanLimitedResource.DEBTS] + 1,
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it.each([
    PlanLimitedResource.DEBTS,
    PlanLimitedResource.CREDIT_CARDS,
    PlanLimitedResource.INCOMES,
  ])("should enforce the configured Free limit for %s", async (resource) => {
    const { service } = buildService(freeSubscription());
    const limit = FREE_PLAN_LIMITS[resource];

    await expect(
      service.assertCanCreate("user-1", resource, limit),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should never block creation for a PRO subscription, regardless of count", async () => {
    const { service } = buildService({
      ...freeSubscription(),
      plan: SubscriptionPlan.PRO,
    });

    await expect(
      service.assertCanCreate(
        "user-1",
        PlanLimitedResource.DEBTS,
        FREE_PLAN_LIMITS[PlanLimitedResource.DEBTS] + 100,
      ),
    ).resolves.toBeUndefined();
  });

  it("should treat a user with no subscription row as FREE", async () => {
    const { service, subscriptionRepository } = buildService(null);

    await expect(
      service.assertCanCreate(
        "user-1",
        PlanLimitedResource.CREDIT_CARDS,
        FREE_PLAN_LIMITS[PlanLimitedResource.CREDIT_CARDS],
      ),
    ).rejects.toBeInstanceOf(AppException);
    expect(subscriptionRepository.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("should mention the resource in the thrown exception message", async () => {
    const { service } = buildService(freeSubscription());

    try {
      await service.assertCanCreate(
        "user-1",
        PlanLimitedResource.INCOMES,
        FREE_PLAN_LIMITS[PlanLimitedResource.INCOMES],
      );
      throw new Error("expected assertCanCreate to reject");
    } catch (error) {
      const response = (error as AppException).getResponse() as {
        message: string;
      };
      expect(response.message).toContain("receitas");
    }
  });

  describe("assertProPlan", () => {
    it("should allow a PRO subscription", async () => {
      const { service } = buildService({
        ...freeSubscription(),
        plan: SubscriptionPlan.PRO,
      });

      await expect(service.assertProPlan("user-1")).resolves.toBeUndefined();
    });

    it("should reject a FREE subscription", async () => {
      const { service } = buildService(freeSubscription());

      await expect(service.assertProPlan("user-1")).rejects.toBeInstanceOf(
        AppException,
      );
    });

    it("should treat a user with no subscription row as FREE", async () => {
      const { service } = buildService(null);

      await expect(service.assertProPlan("user-1")).rejects.toBeInstanceOf(
        AppException,
      );
    });

    it.each([UserGroup.ADMIN, UserGroup.ADMIN_MASTER])(
      "should always allow an %s, regardless of subscription plan",
      async (group) => {
        const { service } = buildService(freeSubscription(), group);

        await expect(service.assertProPlan("user-1")).resolves.toBeUndefined();
      },
    );
  });

  it.each([UserGroup.ADMIN, UserGroup.ADMIN_MASTER])(
    "should never block creation for an %s, regardless of count",
    async (group) => {
      const { service, subscriptionRepository } = buildService(
        freeSubscription(),
        group,
      );

      await expect(
        service.assertCanCreate(
          "user-1",
          PlanLimitedResource.DEBTS,
          FREE_PLAN_LIMITS[PlanLimitedResource.DEBTS] + 100,
        ),
      ).resolves.toBeUndefined();
      expect(subscriptionRepository.findByUserId).not.toHaveBeenCalled();
    },
  );
});
