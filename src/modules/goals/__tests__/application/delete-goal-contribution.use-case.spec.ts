import { DeleteGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/delete-goal-contribution.use-case";
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

describe("DeleteGoalContributionUseCase", () => {
  it("checks Pro plan access and delegates to the repository", async () => {
    const view = goalView();
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };
    const planLimitsService = {
      assertProPlan: jest.fn().mockResolvedValue(undefined),
    };
    const goalRepository = {
      deleteContribution: jest.fn().mockResolvedValue(view),
    };

    const useCase = new DeleteGoalContributionUseCase(
      authorizationService as never,
      planLimitsService as never,
      goalRepository as never,
    );

    const result = await useCase.execute("user-1", "goal-1", "contrib-1");

    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
    expect(goalRepository.deleteContribution).toHaveBeenCalledWith(
      "user-1",
      "goal-1",
      "contrib-1",
    );
    expect(result).toEqual(view);
  });
});
