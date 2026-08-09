import { AppException } from "@/common/exceptions/app-exception";
import { RegisterGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/register-goal-contribution.use-case";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";

function goalView(
  overrides: Partial<FinancialGoalView> = {},
): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 100,
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
    registerContribution: jest
      .fn()
      .mockResolvedValue(goalView({ currentAmount: 200 })),
  };

  const useCase = new RegisterGoalContributionUseCase(
    authorizationService as never,
    planLimitsService as never,
    goalRepository as never,
  );

  return { useCase, goalRepository };
}

describe("RegisterGoalContributionUseCase", () => {
  it("rejects a zero or negative amount", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", { idFinancialGoal: "goal-1", amount: 0 }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("registers the contribution and returns the updated goal", async () => {
    const { useCase, goalRepository } = buildUseCase();

    const result = await useCase.execute("user-1", {
      idFinancialGoal: "goal-1",
      amount: 100.456,
    });

    expect(goalRepository.registerContribution).toHaveBeenCalledWith("user-1", {
      idFinancialGoal: "goal-1",
      amount: 100.46,
      contributedAt: undefined,
      note: undefined,
    });
    expect(result.currentAmount).toBe(200);
  });
});
