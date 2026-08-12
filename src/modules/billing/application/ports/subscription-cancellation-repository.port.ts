import type { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import type { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

export type CreateSubscriptionCancellationPayload = {
  idUsers: string;
  reasons: CancellationReason[];
  otherReason?: string;
  billingCycle?: SubscriptionBillingCycle;
  proStartedAt?: Date;
  requestedAt: Date;
  effectiveCancellationAt?: Date;
};

export interface SubscriptionCancellationRepositoryPort {
  create(payload: CreateSubscriptionCancellationPayload): Promise<void>;
}

export const SUBSCRIPTION_CANCELLATION_REPOSITORY = Symbol(
  "SUBSCRIPTION_CANCELLATION_REPOSITORY",
);
