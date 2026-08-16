import type { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import type { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import type { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

export type SubscriptionView = {
  idSubscription: string;
  idUsers: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  proStartedAt?: Date;
  currentPeriodEnd?: Date;
  billingCycle?: SubscriptionBillingCycle;
  cancelAtPeriodEnd: boolean;
  gatewayCustomerId?: string;
  gatewaySubscriptionId?: string;
  trialEndingNotifiedAt?: Date;
  pastDueSince?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubscriptionPayload = {
  idUsers: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
};

export type UpdateSubscriptionPayload = {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  trialEndsAt?: Date;
  proStartedAt?: Date;
  currentPeriodEnd?: Date;
  billingCycle?: SubscriptionBillingCycle;
  cancelAtPeriodEnd?: boolean;
  gatewayCustomerId?: string;
  gatewaySubscriptionId?: string;
  trialEndingNotifiedAt?: Date | null;
  pastDueSince?: Date | null;
};

export interface SubscriptionRepositoryPort {
  create(payload: CreateSubscriptionPayload): Promise<SubscriptionView>;
  findByUserId(idUsers: string): Promise<SubscriptionView | null>;
  findByGatewaySubscriptionId(
    gatewaySubscriptionId: string,
  ): Promise<SubscriptionView | null>;
  findByStatus(status: SubscriptionStatus): Promise<SubscriptionView[]>;
  findPendingCancellations(): Promise<SubscriptionView[]>;
  updateByUserId(
    idUsers: string,
    payload: UpdateSubscriptionPayload,
  ): Promise<SubscriptionView>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol("SUBSCRIPTION_REPOSITORY");
