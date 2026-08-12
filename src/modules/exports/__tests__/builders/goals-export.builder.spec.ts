import { formatCurrencyBRL } from "@/utils/pdf";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";
import { GoalsExportBuilder } from "../../application/builders/goals-export.builder";

function goalView(overrides: Partial<FinancialGoalView> = {}): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 500,
    targetDate: new Date("2026-12-01"),
    contributions: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("GoalsExportBuilder", () => {
  it("labels a fully funded goal as Concluída with 100% progress", async () => {
    const goalRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [goalView({ currentAmount: 1000 })],
        total: 1,
      }),
    };
    const builder = new GoalsExportBuilder(goalRepository as never);

    const payload = await builder.build("user-1", "Stanley");

    expect(payload.rows[0]).toEqual([
      "Viagem",
      formatCurrencyBRL(1000),
      formatCurrencyBRL(1000),
      "100%",
      "01/12/2026",
      "Concluída",
    ]);
  });

  it("labels a partially funded goal as Em andamento", async () => {
    const goalRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [goalView({ currentAmount: 500 })],
        total: 1,
      }),
    };
    const builder = new GoalsExportBuilder(goalRepository as never);

    const payload = await builder.build("user-1", "Stanley");

    expect(payload.rows[0][3]).toBe("50%");
    expect(payload.rows[0][5]).toBe("Em andamento");
    expect(payload.totals).toEqual([
      { label: "Valor alvo total", value: formatCurrencyBRL(1000) },
      { label: "Valor guardado total", value: formatCurrencyBRL(500) },
    ]);
  });
});
