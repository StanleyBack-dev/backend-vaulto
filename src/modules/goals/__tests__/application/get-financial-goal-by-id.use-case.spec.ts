import { GetFinancialGoalByIdUseCase } from "@/modules/goals/application/use-cases/get/get-financial-goal-by-id.use-case";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";

function goalView(): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 0,
    contributions: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("GetFinancialGoalByIdUseCase", () => {
  it("checks permission, Pro plan access, and delegates to the repository", async () => {
    const view = goalView();
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };
    const planLimitsService = {
      assertProPlan: jest.fn().mockResolvedValue(undefined),
    };
    const goalRepository = {
      findById: jest.fn().mockResolvedValue(view),
    };

    const useCase = new GetFinancialGoalByIdUseCase(
      authorizationService as never,
      planLimitsService as never,
      goalRepository as never,
    );

    const result = await useCase.execute("user-1", "goal-1");

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalled();
    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
    expect(goalRepository.findById).toHaveBeenCalledWith("user-1", "goal-1");
    expect(result).toEqual(view);
  });
});
