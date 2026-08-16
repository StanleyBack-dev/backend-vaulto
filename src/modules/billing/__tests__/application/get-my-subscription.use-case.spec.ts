import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

describe("GetMySubscriptionUseCase", () => {
  it("should delegate to CreateDefaultSubscriptionUseCase and return its result", async () => {
    const subscription = {
      idSubscription: "subscription-1",
      idUsers: "user-1",
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createDefaultSubscriptionUseCase = {
      execute: jest.fn().mockResolvedValue(subscription),
    };

    const useCase = new GetMySubscriptionUseCase(
      createDefaultSubscriptionUseCase as never,
    );

    const result = await useCase.execute("user-1");

    expect(createDefaultSubscriptionUseCase.execute).toHaveBeenCalledWith(
      "user-1",
    );
    expect(result).toBe(subscription);
  });
});
