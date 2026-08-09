import { AppException } from "@/common/exceptions/app-exception";
import { UpdateFinancialGoalUseCase } from "@/modules/goals/application/use-cases/update/update-financial-goal.use-case";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";

function goalView(overrides: Partial<FinancialGoalView> = {}): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 0,
    contributions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };
  const planLimitsService = {
    assertProPlan: jest.fn().mockResolvedValue(undefined),
  };
  const goalRepository = {
    update: jest.fn().mockResolvedValue(goalView({ title: "Viagem 2" })),
  };

  const useCase = new UpdateFinancialGoalUseCase(
    authorizationService as never,
    planLimitsService as never,
    goalRepository as never,
  );

  return { useCase, goalRepository };
}

describe("UpdateFinancialGoalUseCase", () => {
  it("rejects an empty title", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", { idFinancialGoal: "goal-1", title: "   " }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects a zero or negative target amount", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        idFinancialGoal: "goal-1",
        targetAmount: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects a target date in the past", async () => {
    const { useCase } = buildUseCase();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      useCase.execute("user-1", {
        idFinancialGoal: "goal-1",
        targetDate: yesterday,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("updates only the fields provided", async () => {
    const { useCase, goalRepository } = buildUseCase();

    await useCase.execute("user-1", {
      idFinancialGoal: "goal-1",
      title: "Viagem 2",
    });

    expect(goalRepository.update).toHaveBeenCalledWith("user-1", {
      idFinancialGoal: "goal-1",
      title: "Viagem 2",
      description: undefined,
      targetAmount: undefined,
      targetDate: undefined,
    });
  });
});
