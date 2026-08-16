import type { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

export type SubscribeToProCommand = {
  cpfCnpj: string;
  billingCycle: SubscriptionBillingCycle;
  pixAutomatic?: boolean;
};
