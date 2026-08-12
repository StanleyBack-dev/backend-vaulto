import { FinancialHealthStatus } from "@/modules/reports/domain/enums/financial-health-status.enum";
import {
  computeFinancialHealthScore,
  type FinancialHealthScoreInput,
} from "@/modules/reports/domain/services/financial-health-score.service";

function input(
  overrides: Partial<FinancialHealthScoreInput> = {},
): FinancialHealthScoreInput {
  return {
    outstandingDebts: 0,
    outstandingIncome: 0,
    totalDebtsCount: 0,
    overdueDebtsCount: 0,
    averageGoalsProgressPercent: null,
    ...overrides,
  };
}

describe("computeFinancialHealthScore", () => {
  it("scores a perfect debt-free, punctual, goal-free user at 100", () => {
    const result = computeFinancialHealthScore(input());

    expect(result.score).toBe(100);
    expect(result.status).toBe(FinancialHealthStatus.HEALTHY);
    expect(result.reserves).toBeNull();
  });

  it("scores debt commitment at 0 when debts are outstanding but there is no income", () => {
    const result = computeFinancialHealthScore(
      input({ outstandingDebts: 500, outstandingIncome: 0 }),
    );

    expect(result.debtCommitment.score).toBe(0);
  });

  it("lowers the debt commitment score as the debt/income ratio grows", () => {
    const result = computeFinancialHealthScore(
      input({ outstandingDebts: 300, outstandingIncome: 1000 }),
    );

    expect(result.debtCommitment.score).toBe(70);
  });

  it("lowers the punctuality score proportionally to overdue debts", () => {
    const result = computeFinancialHealthScore(
      input({ totalDebtsCount: 4, overdueDebtsCount: 1 }),
    );

    expect(result.punctuality.score).toBe(75);
  });

  it("includes the reserves pillar and its weight when goals exist", () => {
    const result = computeFinancialHealthScore(
      input({ averageGoalsProgressPercent: 40 }),
    );

    expect(result.reserves).toEqual({ score: 40, weight: 0.2 });
    expect(result.debtCommitment.weight).toBeCloseTo(0.5);
    expect(result.punctuality.weight).toBeCloseTo(0.3);
  });

  it("redistributes the reserves weight across the other pillars when there are no goals", () => {
    const result = computeFinancialHealthScore(
      input({ averageGoalsProgressPercent: null }),
    );

    expect(result.reserves).toBeNull();
    expect(result.debtCommitment.weight).toBeCloseTo(0.625);
    expect(result.punctuality.weight).toBeCloseTo(0.375);
    expect(
      result.debtCommitment.weight + result.punctuality.weight,
    ).toBeCloseTo(1);
  });

  it("classifies status by score thresholds", () => {
    const critical = computeFinancialHealthScore(
      input({
        outstandingDebts: 1000,
        outstandingIncome: 1000,
        totalDebtsCount: 1,
        overdueDebtsCount: 1,
      }),
    );
    expect(critical.score).toBe(0);
    expect(critical.status).toBe(FinancialHealthStatus.CRITICAL);

    const attention = computeFinancialHealthScore(
      input({
        outstandingDebts: 500,
        outstandingIncome: 1000,
        totalDebtsCount: 2,
        overdueDebtsCount: 1,
      }),
    );
    expect(attention.score).toBe(50);
    expect(attention.status).toBe(FinancialHealthStatus.ATTENTION);

    const healthy = computeFinancialHealthScore(
      input({
        outstandingDebts: 100,
        outstandingIncome: 1000,
        totalDebtsCount: 10,
        overdueDebtsCount: 1,
      }),
    );
    expect(healthy.score).toBe(90);
    expect(healthy.status).toBe(FinancialHealthStatus.HEALTHY);
  });
});
