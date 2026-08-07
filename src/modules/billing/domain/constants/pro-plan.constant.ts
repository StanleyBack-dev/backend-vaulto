import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

export const PRO_PLAN_PRICES: Record<SubscriptionBillingCycle, number> = {
  [SubscriptionBillingCycle.MONTHLY]: 14.9,
  [SubscriptionBillingCycle.YEARLY]: 149.9,
};

export const PRO_PLAN_TRIAL_DAYS = 7;
