import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

describe("CreateDefaultSubscriptionUseCase", () => {
  it("should create a FREE subscription when the user has none", async () => {
    const subscriptionRepository = {
      findByUserId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        idSubscription: "subscription-1",
        idUsers: "user-1",
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const useCase = new CreateDefaultSubscriptionUseCase(
      subscriptionRepository as never,
    );

    const result = await useCase.execute("user-1");

    expect(subscriptionRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(subscriptionRepository.create).toHaveBeenCalledWith({
      idUsers: "user-1",
      plan: SubscriptionPlan.FREE,
    });
    expect(result.plan).toBe(SubscriptionPlan.FREE);
  });

  it("should return the existing subscription instead of creating a new one", async () => {
    const existing = {
      idSubscription: "subscription-1",
      idUsers: "user-1",
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const subscriptionRepository = {
      findByUserId: jest.fn().mockResolvedValue(existing),
      create: jest.fn(),
    };

    const useCase = new CreateDefaultSubscriptionUseCase(
      subscriptionRepository as never,
    );

    const result = await useCase.execute("user-1");

    expect(result).toBe(existing);
    expect(subscriptionRepository.create).not.toHaveBeenCalled();
  });
});
