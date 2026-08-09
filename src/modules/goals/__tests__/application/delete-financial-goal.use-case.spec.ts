import { DeleteFinancialGoalUseCase } from "@/modules/goals/application/use-cases/delete/delete-financial-goal.use-case";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };
  const planLimitsService = {
    assertProPlan: jest.fn().mockResolvedValue(undefined),
  };
  const goalRepository = {
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new DeleteFinancialGoalUseCase(
    authorizationService as never,
    planLimitsService as never,
    goalRepository as never,
  );

  return { useCase, goalRepository, planLimitsService };
}

describe("DeleteFinancialGoalUseCase", () => {
  it("checks Pro plan access before deleting", async () => {
    const { useCase, planLimitsService, goalRepository } = buildUseCase();

    await useCase.execute("user-1", "goal-1");

    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
    expect(goalRepository.delete).toHaveBeenCalledWith("user-1", "goal-1");
  });
});
