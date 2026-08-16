import type { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import type { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

export type UsersByGroupCount = {
  group: UserGroup;
  count: number;
};

export type SubscriptionsByStatusCount = {
  status: SubscriptionStatus;
  count: number;
};

export type AdminDashboardStatsView = {
  totalUsers: number;
  usersByGroup: UsersByGroupCount[];
  totalSubscriptions: number;
  freeSubscriptions: number;
  activeProSubscriptions: number;
  subscriptionsByStatus: SubscriptionsByStatusCount[];
  estimatedMonthlyRecurringRevenue: number;
  totalSupportTickets: number;
  openSupportTickets: number;
  resolvedSupportTickets: number;
};

export interface AdminRepositoryPort {
  getDashboardStats(): Promise<AdminDashboardStatsView>;
}

export const ADMIN_REPOSITORY = Symbol("ADMIN_REPOSITORY");
