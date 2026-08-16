import { SubscriptionLifecycleController } from "@/modules/billing/presentation/rest/controllers/subscription-lifecycle.controller";

function buildController() {
  const runSubscriptionLifecycleUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue({ trialRemindersSent: 1, downgradedToFree: 0 }),
  };

  const controller = new SubscriptionLifecycleController(
    runSubscriptionLifecycleUseCase as never,
  );

  return { controller, runSubscriptionLifecycleUseCase };
}

describe("SubscriptionLifecycleController", () => {
  it("runs the lifecycle use case", async () => {
    const { controller, runSubscriptionLifecycleUseCase } = buildController();

    const result = await controller.run();

    expect(runSubscriptionLifecycleUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual({ trialRemindersSent: 1, downgradedToFree: 0 });
  });
});
