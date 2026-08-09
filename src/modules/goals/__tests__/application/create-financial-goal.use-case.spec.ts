import { AppException } from "@/common/exceptions/app-exception";
import { CreateFinancialGoalUseCase } from "@/modules/goals/application/use-cases/create/create-financial-goal.use-case";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";

function goalView(
  overrides: Partial<FinancialGoalView> = {},
): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 0,
    contributions: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildUseCase(overrides: { assertProPlan?: () => Promise<void> } = {}) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };
  const planLimitsService = {
    assertProPlan:
      overrides.assertProPlan ?? jest.fn().mockResolvedValue(undefined),
  };
  const goalRepository = {
    create: jest.fn().mockResolvedValue(goalView()),
  };

  const useCase = new CreateFinancialGoalUseCase(
    authorizationService as never,
    planLimitsService as never,
    goalRepository as never,
  );

  return { useCase, authorizationService, planLimitsService, goalRepository };
}

describe("CreateFinancialGoalUseCase", () => {
  it("rejects when the user is not on the Pro plan", async () => {
    const { useCase } = buildUseCase({
      assertProPlan: jest
        .fn()
        .mockRejectedValue(
          new AppException({ code: "X", status: 403, message: "no" }, "no"),
        ),
    });

    await expect(
      useCase.execute("user-1", { title: "Viagem", targetAmount: 1000 }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects an invalid target amount", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", { title: "Viagem", targetAmount: 0 }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects a target date in the past", async () => {
    const { useCase } = buildUseCase();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      useCase.execute("user-1", {
        title: "Viagem",
        targetAmount: 1000,
        targetDate: yesterday,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("creates the goal when input is valid", async () => {
    const { useCase, goalRepository } = buildUseCase();

    const result = await useCase.execute("user-1", {
      title: "  Viagem  ",
      targetAmount: 1000.456,
    });

    expect(goalRepository.create).toHaveBeenCalledWith({
      idUsers: "user-1",
      title: "Viagem",
      description: undefined,
      targetAmount: 1000.46,
      targetDate: undefined,
    });
    expect(result).toEqual(goalView());
  });
});
