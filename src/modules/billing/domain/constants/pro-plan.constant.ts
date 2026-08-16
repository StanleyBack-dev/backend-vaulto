import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

// TEMP: prices dropped to R$5 (Asaas' minimum charge for billingType
// UNDEFINED) to smoke-test the Pro checkout flow. Revert to 14.9 / 149.9
// once confirmed.
export const PRO_PLAN_PRICES: Record<SubscriptionBillingCycle, number> = {
  [SubscriptionBillingCycle.MONTHLY]: 5,
  [SubscriptionBillingCycle.YEARLY]: 5,
};

// How long a subscription can stay PAST_DUE before we downgrade it to FREE.
// Gives the customer time to pay a Pix/Boleto charge manually before losing
// Pro access, without leaving it PAST_DUE forever if they never do.
export const PAST_DUE_GRACE_PERIOD_DAYS = 3;
