import { computeGoalProgress } from "@/modules/goals/domain/services/goal-progress.service";
import { FinancialGoalStatus } from "@/modules/goals/domain/enums/financial-goal-status.enum";

describe("computeGoalProgress", () => {
  it("marks the goal as completed once currentAmount reaches targetAmount", () => {
    const result = computeGoalProgress({
      targetAmount: 1000,
      currentAmount: 1000,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result).toEqual({
      status: FinancialGoalStatus.COMPLETED,
      progressPercent: 100,
      estimatedMonthsToComplete: 0,
    });
  });

  it("marks the goal as completed when currentAmount exceeds targetAmount", () => {
    const result = computeGoalProgress({
      targetAmount: 1000,
      currentAmount: 1500,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.status).toBe(FinancialGoalStatus.COMPLETED);
    expect(result.progressPercent).toBe(100);
  });

  it("computes progress percent and estimated months from the average monthly pace", () => {
    const result = computeGoalProgress(
      {
        targetAmount: 1000,
        currentAmount: 200,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      new Date("2026-03-01T00:00:00.000Z"),
    );

    // 200 saved over 2 elapsed months = 100/month average;
    // 800 remaining / 100 per month = 8 months.
    expect(result.status).toBe(FinancialGoalStatus.IN_PROGRESS);
    expect(result.progressPercent).toBe(20);
    expect(result.estimatedMonthsToComplete).toBe(8);
  });

  it("returns null estimate when nothing has been saved yet", () => {
    const result = computeGoalProgress(
      {
        targetAmount: 1000,
        currentAmount: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      new Date("2026-03-01T00:00:00.000Z"),
    );

    expect(result.progressPercent).toBe(0);
    expect(result.estimatedMonthsToComplete).toBeNull();
  });

  it("treats a goal created today as at least one elapsed month, avoiding division by zero", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const result = computeGoalProgress(
      {
        targetAmount: 1000,
        currentAmount: 100,
        createdAt: now,
      },
      now,
    );

    expect(result.estimatedMonthsToComplete).toBe(9);
  });

  it("never reports more than 100% progress", () => {
    const result = computeGoalProgress({
      targetAmount: 1000,
      currentAmount: 5000,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.progressPercent).toBe(100);
  });
});
