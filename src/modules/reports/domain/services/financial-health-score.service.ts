import { FinancialHealthStatus } from "../enums/financial-health-status.enum";

export interface FinancialHealthPillarScore {
  score: number;
  weight: number;
}

export interface FinancialHealthScoreInput {
  outstandingDebts: number;
  outstandingIncome: number;
  totalDebtsCount: number;
  overdueDebtsCount: number;
  /** Average goal progress (0-100), or null when the user has no goals. */
  averageGoalsProgressPercent: number | null;
}

export interface FinancialHealthScoreResult {
  score: number;
  status: FinancialHealthStatus;
  debtCommitment: FinancialHealthPillarScore;
  punctuality: FinancialHealthPillarScore;
  reserves: FinancialHealthPillarScore | null;
}

// Baseline weights before renormalization. Reserves only exists when the
// user has at least one goal — otherwise its weight is redistributed across
// the other two pillars instead of silently penalizing users who simply
// haven't created a goal yet.
const BASE_WEIGHTS = {
  debtCommitment: 0.5,
  punctuality: 0.3,
  reserves: 0.2,
};

const HEALTHY_THRESHOLD = 70;
const ATTENTION_THRESHOLD = 40;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function computeDebtCommitmentScore(
  outstandingDebts: number,
  outstandingIncome: number,
): number {
  if (outstandingDebts <= 0) {
    return 100;
  }

  if (outstandingIncome <= 0) {
    return 0;
  }

  const ratio = outstandingDebts / outstandingIncome;
  return clampScore(100 - ratio * 100);
}

function computePunctualityScore(
  totalDebtsCount: number,
  overdueDebtsCount: number,
): number {
  if (totalDebtsCount <= 0) {
    return 100;
  }

  const overdueRatio = overdueDebtsCount / totalDebtsCount;
  return clampScore(100 - overdueRatio * 100);
}

function statusFromScore(score: number): FinancialHealthStatus {
  if (score >= HEALTHY_THRESHOLD) {
    return FinancialHealthStatus.HEALTHY;
  }

  if (score >= ATTENTION_THRESHOLD) {
    return FinancialHealthStatus.ATTENTION;
  }

  return FinancialHealthStatus.CRITICAL;
}

export function computeFinancialHealthScore(
  input: FinancialHealthScoreInput,
): FinancialHealthScoreResult {
  const debtCommitmentScore = computeDebtCommitmentScore(
    input.outstandingDebts,
    input.outstandingIncome,
  );
  const punctualityScore = computePunctualityScore(
    input.totalDebtsCount,
    input.overdueDebtsCount,
  );

  const hasReserves = input.averageGoalsProgressPercent !== null;
  const reservesScore = hasReserves
    ? clampScore(input.averageGoalsProgressPercent as number)
    : null;

  const activeWeightTotal =
    BASE_WEIGHTS.debtCommitment +
    BASE_WEIGHTS.punctuality +
    (hasReserves ? BASE_WEIGHTS.reserves : 0);

  const debtCommitmentWeight = BASE_WEIGHTS.debtCommitment / activeWeightTotal;
  const punctualityWeight = BASE_WEIGHTS.punctuality / activeWeightTotal;
  const reservesWeight = hasReserves
    ? BASE_WEIGHTS.reserves / activeWeightTotal
    : 0;

  const score = clampScore(
    debtCommitmentScore * debtCommitmentWeight +
      punctualityScore * punctualityWeight +
      (reservesScore ?? 0) * reservesWeight,
  );

  return {
    score,
    status: statusFromScore(score),
    debtCommitment: {
      score: debtCommitmentScore,
      weight: debtCommitmentWeight,
    },
    punctuality: { score: punctualityScore, weight: punctualityWeight },
    reserves: hasReserves
      ? { score: reservesScore as number, weight: reservesWeight }
      : null,
  };
}
