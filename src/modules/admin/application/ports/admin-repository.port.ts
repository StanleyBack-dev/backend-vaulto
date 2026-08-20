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

export type AdminReferralStatsView = {
  totalReferredUsers: number;
  totalQualifiedReferrals: number;
  creditAmountCents: number;
  totalCreditsGrantedCents: number;
  totalClawedBackCents: number;
  totalWithdrawnCents: number;
  totalPendingWithdrawalCents: number;
  totalFailedWithdrawalCents: number;
  totalOutstandingLiabilityCents: number;
};

export type AdminReferralMonthlyPoint = {
  month: string;
  qualifiedReferrals: number;
  creditsGrantedCents: number;
};

export type AdminReferralLeaderboardRow = {
  idUsers: string;
  name: string;
  email: string;
  qualifiedReferralsCount: number;
  totalCreditsGrantedCents: number;
  availableBalanceCents: number;
};

export interface AdminRepositoryPort {
  getDashboardStats(): Promise<AdminDashboardStatsView>;
  getReferralStats(): Promise<AdminReferralStatsView>;
  getReferralMonthlyTrend(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<AdminReferralMonthlyPoint[]>;
  getReferralLeaderboard(): Promise<AdminReferralLeaderboardRow[]>;
}

export const ADMIN_REPOSITORY = Symbol("ADMIN_REPOSITORY");
