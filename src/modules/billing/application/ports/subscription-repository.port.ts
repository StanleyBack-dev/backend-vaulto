import type { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import type { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

export type SubscriptionView = {
  idSubscription: string;
  idUsers: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  gatewayCustomerId?: string;
  gatewaySubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubscriptionPayload = {
  idUsers: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
};

export interface SubscriptionRepositoryPort {
  create(payload: CreateSubscriptionPayload): Promise<SubscriptionView>;
  findByUserId(idUsers: string): Promise<SubscriptionView | null>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol("SUBSCRIPTION_REPOSITORY");
