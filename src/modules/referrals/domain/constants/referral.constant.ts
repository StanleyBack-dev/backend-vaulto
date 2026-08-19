const DEFAULT_CREDIT_AMOUNT_CENTS = 500;
const DEFAULT_MIN_WITHDRAWAL_CENTS = 2000;
const DEFAULT_CREDIT_HOLD_DAYS = 7;

function parsePositiveInt(
  envValue: string | undefined,
  fallback: number,
): number {
  const parsed = envValue !== undefined ? Number(envValue) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Configurable via Vercel env vars (see env.validation.ts) so these can
// change with an env update + redeploy instead of a code change — same
// pattern as PRO_PLAN_PRICES in pro-plan.constant.ts. This file has no
// NestJS DI, so it reads process.env directly rather than through
// ConfigService.

// Cash credit granted to the referrer for each referral that qualifies
// (the referred user's subscription had its first charge confirmed paid —
// see QualifyReferralUseCase). Cents, so R$5,00 by default.
export const REFERRAL_CREDIT_AMOUNT_CENTS = parsePositiveInt(
  process.env.REFERRAL_CREDIT_AMOUNT_CENTS,
  DEFAULT_CREDIT_AMOUNT_CENTS,
);

// Minimum accumulated available balance before a withdrawal can be
// requested. Cents, so R$20,00 by default.
export const REFERRAL_MIN_WITHDRAWAL_CENTS = parsePositiveInt(
  process.env.REFERRAL_MIN_WITHDRAWAL_CENTS,
  DEFAULT_MIN_WITHDRAWAL_CENTS,
);

// How long a credit sits in PENDING_HOLD before becoming AVAILABLE for
// withdrawal. Matches the CDC art. 49 unconditional refund window (7 days)
// for purchases made remotely — the most likely source of a clawback.
export const REFERRAL_CREDIT_HOLD_DAYS = parsePositiveInt(
  process.env.REFERRAL_CREDIT_HOLD_DAYS,
  DEFAULT_CREDIT_HOLD_DAYS,
);
