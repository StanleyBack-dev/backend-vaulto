import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

const DEFAULT_MONTHLY_PRICE = 14.9;
const DEFAULT_YEARLY_PRICE = 149.9;

function parsePrice(envValue: string | undefined, fallback: number): number {
  const parsed = envValue !== undefined ? Number(envValue) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Configurable via PRO_PLAN_PRICE_MONTHLY/PRO_PLAN_PRICE_YEARLY (see
// env.validation.ts) so the price can change with a Vercel env update +
// redeploy instead of a code change. This file has no NestJS DI, so it
// reads process.env directly — same pattern as cookie.config.ts — rather
// than through ConfigService.
export const PRO_PLAN_PRICES: Record<SubscriptionBillingCycle, number> = {
  [SubscriptionBillingCycle.MONTHLY]: parsePrice(
    process.env.PRO_PLAN_PRICE_MONTHLY,
    DEFAULT_MONTHLY_PRICE,
  ),
  [SubscriptionBillingCycle.YEARLY]: parsePrice(
    process.env.PRO_PLAN_PRICE_YEARLY,
    DEFAULT_YEARLY_PRICE,
  ),
};

// How long a subscription can stay PAST_DUE before we downgrade it to FREE.
// Gives the customer time to pay a Pix/Boleto charge manually before losing
// Pro access, without leaving it PAST_DUE forever if they never do.
export const PAST_DUE_GRACE_PERIOD_DAYS = 3;
