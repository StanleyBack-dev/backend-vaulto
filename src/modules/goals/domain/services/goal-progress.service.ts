import { FinancialGoalStatus } from "@/modules/goals/domain/enums/financial-goal-status.enum";

export interface GoalProgressInput {
  targetAmount: number;
  currentAmount: number;
  createdAt: Date;
}

export interface GoalProgress {
  status: FinancialGoalStatus;
  progressPercent: number;
  estimatedMonthsToComplete: number | null;
}

function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  return Math.max(months, 0);
}

// The estimate is a simple linear projection from the average contribution
// pace since the goal was created (currentAmount / monthsElapsed) — no
// weighting of recent vs. old contributions, kept intentionally simple for
// the first version of this feature.
export function computeGoalProgress(
  input: GoalProgressInput,
  now: Date = new Date(),
): GoalProgress {
  const progressPercent =
    input.targetAmount > 0
      ? Math.min(
          Math.round((input.currentAmount / input.targetAmount) * 100),
          100,
        )
      : 0;

  if (input.currentAmount >= input.targetAmount) {
    return {
      status: FinancialGoalStatus.COMPLETED,
      progressPercent: 100,
      estimatedMonthsToComplete: 0,
    };
  }

  const monthsElapsed = Math.max(monthsBetween(input.createdAt, now), 1);
  const averageMonthlyContribution = input.currentAmount / monthsElapsed;
  const remainingAmount = input.targetAmount - input.currentAmount;

  const estimatedMonthsToComplete =
    averageMonthlyContribution > 0
      ? Math.ceil(remainingAmount / averageMonthlyContribution)
      : null;

  return {
    status: FinancialGoalStatus.IN_PROGRESS,
    progressPercent,
    estimatedMonthsToComplete,
  };
}
