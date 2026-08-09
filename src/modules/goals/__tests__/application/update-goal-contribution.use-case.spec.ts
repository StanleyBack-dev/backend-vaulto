import { AppException } from "@/common/exceptions/app-exception";
import { UpdateGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/update-goal-contribution.use-case";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";

function goalView(overrides: Partial<FinancialGoalView> = {}): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 200,
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
    updateContribution: jest
      .fn()
      .mockResolvedValue(goalView({ currentAmount: 150 })),
  };

  const useCase = new UpdateGoalContributionUseCase(
    authorizationService as never,
    planLimitsService as never,
    goalRepository as never,
  );

  return { useCase, goalRepository, authorizationService, planLimitsService };
}

describe("UpdateGoalContributionUseCase", () => {
  it("rejects a zero or negative amount", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        idFinancialGoal: "goal-1",
        idGoalContribution: "contrib-1",
        amount: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("checks Pro plan access and updates the contribution", async () => {
    const { useCase, goalRepository, planLimitsService } = buildUseCase();

    const result = await useCase.execute("user-1", {
      idFinancialGoal: "goal-1",
      idGoalContribution: "contrib-1",
      amount: 150.456,
    });

    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
    expect(goalRepository.updateContribution).toHaveBeenCalledWith("user-1", {
      idFinancialGoal: "goal-1",
      idGoalContribution: "contrib-1",
      amount: 150.46,
      contributedAt: undefined,
      note: undefined,
    });
    expect(result.currentAmount).toBe(150);
  });

  it("allows updating only the note without an amount", async () => {
    const { useCase, goalRepository } = buildUseCase();

    await useCase.execute("user-1", {
      idFinancialGoal: "goal-1",
      idGoalContribution: "contrib-1",
      note: "Bônus de julho",
    });

    expect(goalRepository.updateContribution).toHaveBeenCalledWith("user-1", {
      idFinancialGoal: "goal-1",
      idGoalContribution: "contrib-1",
      amount: undefined,
      contributedAt: undefined,
      note: "Bônus de julho",
    });
  });
});
