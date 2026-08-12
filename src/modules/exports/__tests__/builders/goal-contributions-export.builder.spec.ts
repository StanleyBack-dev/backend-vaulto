import { AppException } from "@/common/exceptions/app-exception";
import { formatCurrencyBRL } from "@/utils/pdf";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";
import { GoalContributionsExportBuilder } from "../../application/builders/goal-contributions-export.builder";

function goalView(
  overrides: Partial<FinancialGoalView> = {},
): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 300,
    contributions: [
      {
        idGoalContribution: "c-2",
        idFinancialGoal: "goal-1",
        amount: 100,
        contributedAt: new Date("2026-02-01"),
        createdAt: new Date("2026-02-01"),
      },
      {
        idGoalContribution: "c-1",
        idFinancialGoal: "goal-1",
        amount: 200,
        contributedAt: new Date("2026-01-01"),
        note: "Bônus",
        createdAt: new Date("2026-01-01"),
      },
    ],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("GoalContributionsExportBuilder", () => {
  it("rejects when no goal is selected", async () => {
    const goalRepository = { findById: jest.fn() };
    const builder = new GoalContributionsExportBuilder(goalRepository as never);

    await expect(builder.build("user-1", "Stanley", {})).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("sorts contributions chronologically and totals the amount", async () => {
    const goalRepository = {
      findById: jest.fn().mockResolvedValue(goalView()),
    };
    const builder = new GoalContributionsExportBuilder(goalRepository as never);

    const payload = await builder.build("user-1", "Stanley", {
      idFinancialGoal: "goal-1",
    });

    expect(payload.documentSubtitle).toBe("Viagem");
    expect(payload.rows).toEqual([
      ["01/01/2026", formatCurrencyBRL(200), "Bônus"],
      ["01/02/2026", formatCurrencyBRL(100), "—"],
    ]);
    expect(payload.totals).toEqual([
      { label: "Total contribuído", value: formatCurrencyBRL(300) },
    ]);
  });
});
