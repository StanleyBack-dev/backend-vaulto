import { ListFinancialGoalsUseCase } from "@/modules/goals/application/use-cases/get/list-financial-goals.use-case";
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase(
  overrides: { records?: FinancialGoalView[]; total?: number } = {},
) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };
  const planLimitsService = {
    assertProPlan: jest.fn().mockResolvedValue(undefined),
  };
  const goalRepository = {
    listByUser: jest.fn().mockResolvedValue({
      records: overrides.records ?? [goalView()],
      total: overrides.total ?? 1,
    }),
  };

  const useCase = new ListFinancialGoalsUseCase(
    authorizationService as never,
    planLimitsService as never,
    goalRepository as never,
  );

  return { useCase, authorizationService, planLimitsService, goalRepository };
}

describe("ListFinancialGoalsUseCase", () => {
  it("checks Pro plan access before listing", async () => {
    const { useCase, planLimitsService } = buildUseCase();

    await useCase.execute("user-1");

    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
  });

  it("returns paginated results", async () => {
    const { useCase } = buildUseCase({ total: 1 });

    const result = await useCase.execute("user-1", { page: 1, limit: 10 });

    expect(result).toEqual({
      items: [goalView()],
      total: 1,
      currentPage: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
    });
  });
});
