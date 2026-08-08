import { AppException } from "@/common/exceptions/app-exception";
import { SubscriptionLifecycleController } from "@/modules/billing/presentation/rest/controllers/subscription-lifecycle.controller";

const CRON_SECRET = "a".repeat(16);

function buildController(overrides: { secret?: string } = {}) {
  const runSubscriptionLifecycleUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue({ trialRemindersSent: 1, downgradedToFree: 0 }),
  };

  const configService = {
    get: jest
      .fn()
      .mockReturnValue("secret" in overrides ? overrides.secret : CRON_SECRET),
  };

  const controller = new SubscriptionLifecycleController(
    runSubscriptionLifecycleUseCase as never,
    configService as never,
  );

  return { controller, runSubscriptionLifecycleUseCase };
}

describe("SubscriptionLifecycleController", () => {
  it("runs the lifecycle use case when the bearer token matches CRON_SECRET", async () => {
    const { controller, runSubscriptionLifecycleUseCase } = buildController();

    const result = await controller.run(`Bearer ${CRON_SECRET}`);

    expect(runSubscriptionLifecycleUseCase.execute).toHaveBeenCalled();
    expect(result).toEqual({ trialRemindersSent: 1, downgradedToFree: 0 });
  });

  it("rejects when the bearer token does not match CRON_SECRET", async () => {
    const { controller } = buildController();

    await expect(controller.run("Bearer wrong-token")).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects when no authorization header is provided", async () => {
    const { controller } = buildController();

    await expect(controller.run(undefined)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("rejects when CRON_SECRET is not configured", async () => {
    const { controller } = buildController({ secret: undefined });

    await expect(
      controller.run(`Bearer ${CRON_SECRET}`),
    ).rejects.toBeInstanceOf(AppException);
  });
});
