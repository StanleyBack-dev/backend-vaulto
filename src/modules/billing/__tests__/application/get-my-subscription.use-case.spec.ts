import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

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

function buildUseCase(subscription: unknown, group: UserGroup) {
  const createDefaultSubscriptionUseCase = {
    execute: jest.fn().mockResolvedValue(subscription),
  };
  const userRepository = {
    findOne: jest.fn().mockResolvedValue({ idUsers: "user-1", group }),
  };

  const useCase = new GetMySubscriptionUseCase(
    createDefaultSubscriptionUseCase as never,
    userRepository as never,
  );

  return { useCase, createDefaultSubscriptionUseCase, userRepository };
}

describe("GetMySubscriptionUseCase", () => {
  it("should delegate to CreateDefaultSubscriptionUseCase and return its result for a regular USER", async () => {
    const subscription = freeSubscription();
    const { useCase, createDefaultSubscriptionUseCase } = buildUseCase(
      subscription,
      UserGroup.USER,
    );

    const result = await useCase.execute("user-1");

    expect(createDefaultSubscriptionUseCase.execute).toHaveBeenCalledWith(
      "user-1",
    );
    expect(result).toBe(subscription);
  });

  it.each([UserGroup.ADMIN, UserGroup.ADMIN_MASTER])(
    "should present an %s as an active Pro subscriber, regardless of the persisted plan",
    async (group) => {
      const { useCase } = buildUseCase(freeSubscription(), group);

      const result = await useCase.execute("user-1");

      expect(result.plan).toBe(SubscriptionPlan.PRO);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    },
  );
});
