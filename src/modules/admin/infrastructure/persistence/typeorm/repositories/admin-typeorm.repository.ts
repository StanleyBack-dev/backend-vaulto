import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Not, Repository } from "typeorm";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import type {
  AdminDashboardStatsView,
  AdminProLeadRow,
  AdminProLeadsFilter,
  AdminProLeadStatsView,
  AdminRepositoryPort,
  AdminReferralLeaderboardRow,
  AdminReferralMonthlyPoint,
  AdminReferralStatsView,
} from "@/modules/admin/application/ports/admin-repository.port";
import { PRO_PLAN_PRICES } from "@/modules/billing/domain/constants/pro-plan.constant";
import { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { ProLeadEventEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/pro-lead-event.entity";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";
import { REFERRAL_CREDIT_AMOUNT_CENTS } from "@/modules/referrals/domain/constants/referral.constant";
import { ReferralCreditStatus } from "@/modules/referrals/domain/enums/referral-credit-status.enum";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";
import { ReferralCreditEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-credit.entity";
import { ReferralWithdrawalEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-withdrawal.entity";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";
import { SupportMessageEntity } from "@/modules/support/infrastructure/persistence/typeorm/entities/support-message.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

const ACTIVE_PRO_STATUSES = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];
const OPEN_TICKET_STATUSES = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.ANSWERED,
];
const ACTIVE_WITHDRAWAL_STATUSES = [
  ReferralWithdrawalStatus.REQUESTED,
  ReferralWithdrawalStatus.PROCESSING,
  ReferralWithdrawalStatus.COMPLETED,
];

@Injectable()
export class AdminTypeormRepository implements AdminRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SupportMessageEntity)
    private readonly supportMessageRepository: Repository<SupportMessageEntity>,
    @InjectRepository(ReferralCreditEntity)
    private readonly referralCreditRepository: Repository<ReferralCreditEntity>,
    @InjectRepository(ReferralWithdrawalEntity)
    private readonly referralWithdrawalRepository: Repository<ReferralWithdrawalEntity>,
    @InjectRepository(ProLeadEventEntity)
    private readonly proLeadEventRepository: Repository<ProLeadEventEntity>,
  ) {}

  async getDashboardStats(): Promise<AdminDashboardStatsView> {
    const [
      totalUsers,
      usersByGroupRaw,
      totalSubscriptions,
      freeSubscriptions,
      activeProSubscriptions,
      subscriptionsByStatusRaw,
      activeProByBillingCycleRaw,
      totalSupportTickets,
      openSupportTickets,
      resolvedSupportTickets,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository
        .createQueryBuilder("user")
        .select("user.group", "group")
        .addSelect("COUNT(*)", "count")
        .groupBy("user.group")
        .getRawMany<{ group: string; count: string }>(),
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({
        where: { plan: SubscriptionPlan.FREE },
      }),
      this.subscriptionRepository.count({
        where: {
          plan: SubscriptionPlan.PRO,
          status: In(ACTIVE_PRO_STATUSES),
        },
      }),
      this.subscriptionRepository
        .createQueryBuilder("subscription")
        .select("subscription.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("subscription.status")
        .getRawMany<{ status: string; count: string }>(),
      this.subscriptionRepository
        .createQueryBuilder("subscription")
        .select("subscription.billingCycle", "billingCycle")
        .addSelect("COUNT(*)", "count")
        .where("subscription.plan = :plan", { plan: SubscriptionPlan.PRO })
        .andWhere("subscription.status IN (:...statuses)", {
          statuses: ACTIVE_PRO_STATUSES,
        })
        .groupBy("subscription.billingCycle")
        .getRawMany<{ billingCycle: string; count: string }>(),
      this.supportMessageRepository.count(),
      this.supportMessageRepository.count({
        where: { status: In(OPEN_TICKET_STATUSES) },
      }),
      this.supportMessageRepository.count({
        where: { status: SupportTicketStatus.RESOLVED },
      }),
    ]);

    return {
      totalUsers,
      usersByGroup: usersByGroupRaw.map((row) => ({
        group:
          row.group as AdminDashboardStatsView["usersByGroup"][number]["group"],
        count: Number(row.count),
      })),
      totalSubscriptions,
      freeSubscriptions,
      activeProSubscriptions,
      subscriptionsByStatus: subscriptionsByStatusRaw.map((row) => ({
        status: row.status as SubscriptionStatus,
        count: Number(row.count),
      })),
      estimatedMonthlyRecurringRevenue: this.calculateMonthlyRecurringRevenue(
        activeProByBillingCycleRaw,
      ),
      totalSupportTickets,
      openSupportTickets,
      resolvedSupportTickets,
    };
  }

  private calculateMonthlyRecurringRevenue(
    rows: Array<{ billingCycle: string; count: string }>,
  ): number {
    return rows.reduce((total, row) => {
      const count = Number(row.count);

      if (row.billingCycle === SubscriptionBillingCycle.MONTHLY) {
        return (
          total + count * PRO_PLAN_PRICES[SubscriptionBillingCycle.MONTHLY]
        );
      }

      if (row.billingCycle === SubscriptionBillingCycle.YEARLY) {
        return (
          total +
          (count * PRO_PLAN_PRICES[SubscriptionBillingCycle.YEARLY]) / 12
        );
      }

      return total;
    }, 0);
  }

  async getReferralStats(): Promise<AdminReferralStatsView> {
    const [
      totalReferredUsers,
      totalQualifiedReferrals,
      creditTotalsRaw,
      withdrawalTotalsRaw,
    ] = await Promise.all([
      this.userRepository.count({
        where: { referredByUserId: Not(IsNull()) },
      }),
      this.userRepository.count({
        where: {
          referredByUserId: Not(IsNull()),
          referralQualifiedAt: Not(IsNull()),
        },
      }),
      this.referralCreditRepository
        .createQueryBuilder("credit")
        .select("credit.status", "status")
        .addSelect("COALESCE(SUM(credit.amountCents), 0)", "total")
        .groupBy("credit.status")
        .getRawMany<{ status: string; total: string }>(),
      this.referralWithdrawalRepository
        .createQueryBuilder("withdrawal")
        .select("withdrawal.status", "status")
        .addSelect("COALESCE(SUM(withdrawal.amountCents), 0)", "total")
        .groupBy("withdrawal.status")
        .getRawMany<{ status: string; total: string }>(),
    ]);

    const creditByStatus = new Map(
      creditTotalsRaw.map((row) => [row.status, Number(row.total)]),
    );
    const withdrawalByStatus = new Map(
      withdrawalTotalsRaw.map((row) => [row.status, Number(row.total)]),
    );

    const availableCents =
      creditByStatus.get(ReferralCreditStatus.AVAILABLE) ?? 0;
    const pendingHoldCents =
      creditByStatus.get(ReferralCreditStatus.PENDING_HOLD) ?? 0;
    const clawedBackCents =
      creditByStatus.get(ReferralCreditStatus.CLAWED_BACK) ?? 0;

    const completedWithdrawalCents =
      withdrawalByStatus.get(ReferralWithdrawalStatus.COMPLETED) ?? 0;
    const pendingWithdrawalCents =
      (withdrawalByStatus.get(ReferralWithdrawalStatus.REQUESTED) ?? 0) +
      (withdrawalByStatus.get(ReferralWithdrawalStatus.PROCESSING) ?? 0);
    const failedWithdrawalCents =
      withdrawalByStatus.get(ReferralWithdrawalStatus.FAILED) ?? 0;

    // What's currently withdrawable across every referrer, if everyone
    // requested a payout today — the credit side of ACTIVE_WITHDRAWAL_STATUSES
    // (see request-referral-withdrawal.use-case.ts's own per-user version of
    // this same "available minus already reserved" formula).
    const totalOutstandingLiabilityCents = Math.max(
      availableCents - (completedWithdrawalCents + pendingWithdrawalCents),
      0,
    );

    return {
      totalReferredUsers,
      totalQualifiedReferrals,
      creditAmountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
      totalCreditsGrantedCents:
        availableCents + pendingHoldCents + clawedBackCents,
      totalClawedBackCents: clawedBackCents,
      totalWithdrawnCents: completedWithdrawalCents,
      totalPendingWithdrawalCents: pendingWithdrawalCents,
      totalFailedWithdrawalCents: failedWithdrawalCents,
      totalOutstandingLiabilityCents,
    };
  }

  async getReferralMonthlyTrend(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<AdminReferralMonthlyPoint[]> {
    const rows = await this.referralCreditRepository
      .createQueryBuilder("credit")
      .select("TO_CHAR(credit.qualifiedAt, 'YYYY-MM')", "month")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(credit.amountCents), 0)", "total")
      .where("credit.qualifiedAt >= :dateFrom", { dateFrom })
      .andWhere("credit.qualifiedAt <= :dateTo", { dateTo })
      .groupBy("month")
      .getRawMany<{ month: string; count: string; total: string }>();

    const byMonth = new Map(
      rows.map((row) => [
        row.month,
        { count: Number(row.count), total: Number(row.total) },
      ]),
    );

    return this.enumerateMonths(dateFrom, dateTo).map((month) => {
      const entry = byMonth.get(month);
      return {
        month,
        qualifiedReferrals: entry?.count ?? 0,
        creditsGrantedCents: entry?.total ?? 0,
      };
    });
  }

  async getReferralLeaderboard(): Promise<AdminReferralLeaderboardRow[]> {
    const [
      referredCountsRaw,
      creditTotalsRaw,
      availableCreditsRaw,
      reservedWithdrawalsRaw,
    ] = await Promise.all([
      this.userRepository
        .createQueryBuilder("referred")
        .select("referred.referredByUserId", "idUsers")
        .addSelect("COUNT(*)", "count")
        .where("referred.referredByUserId IS NOT NULL")
        .andWhere("referred.referralQualifiedAt IS NOT NULL")
        .groupBy("referred.referredByUserId")
        .getRawMany<{ idUsers: string; count: string }>(),
      this.referralCreditRepository
        .createQueryBuilder("credit")
        .select("credit.idUsers", "idUsers")
        .addSelect("COALESCE(SUM(credit.amountCents), 0)", "total")
        .groupBy("credit.idUsers")
        .getRawMany<{ idUsers: string; total: string }>(),
      this.referralCreditRepository
        .createQueryBuilder("credit")
        .select("credit.idUsers", "idUsers")
        .addSelect("COALESCE(SUM(credit.amountCents), 0)", "total")
        .where("credit.status = :status", {
          status: ReferralCreditStatus.AVAILABLE,
        })
        .groupBy("credit.idUsers")
        .getRawMany<{ idUsers: string; total: string }>(),
      this.referralWithdrawalRepository
        .createQueryBuilder("withdrawal")
        .select("withdrawal.idUsers", "idUsers")
        .addSelect("COALESCE(SUM(withdrawal.amountCents), 0)", "total")
        .where("withdrawal.status IN (:...statuses)", {
          statuses: ACTIVE_WITHDRAWAL_STATUSES,
        })
        .groupBy("withdrawal.idUsers")
        .getRawMany<{ idUsers: string; total: string }>(),
    ]);

    const referredCountByUser = new Map(
      referredCountsRaw.map((row) => [row.idUsers, Number(row.count)]),
    );

    if (referredCountByUser.size === 0) {
      return [];
    }

    const creditTotalByUser = new Map(
      creditTotalsRaw.map((row) => [row.idUsers, Number(row.total)]),
    );
    const availableByUser = new Map(
      availableCreditsRaw.map((row) => [row.idUsers, Number(row.total)]),
    );
    const reservedByUser = new Map(
      reservedWithdrawalsRaw.map((row) => [row.idUsers, Number(row.total)]),
    );

    const referrerIds = Array.from(referredCountByUser.keys());
    const referrers = await this.userRepository.findBy({
      idUsers: In(referrerIds),
    });
    const referrerById = new Map(referrers.map((user) => [user.idUsers, user]));

    return referrerIds
      .map((idUsers): AdminReferralLeaderboardRow | null => {
        const user = referrerById.get(idUsers);
        if (!user) return null;

        const available = availableByUser.get(idUsers) ?? 0;
        const reserved = reservedByUser.get(idUsers) ?? 0;

        return {
          idUsers,
          name: user.name,
          email: user.email,
          qualifiedReferralsCount: referredCountByUser.get(idUsers) ?? 0,
          totalCreditsGrantedCents: creditTotalByUser.get(idUsers) ?? 0,
          availableBalanceCents: Math.max(available - reserved, 0),
        };
      })
      .filter((row): row is AdminReferralLeaderboardRow => row !== null)
      .sort((a, b) => b.qualifiedReferralsCount - a.qualifiedReferralsCount);
  }

  async getProLeadStats(): Promise<AdminProLeadStatsView> {
    const [
      totalPlanClicks,
      totalCheckoutReached,
      uniqueClickersRaw,
      uniqueCheckoutRaw,
    ] = await Promise.all([
      this.proLeadEventRepository.count({
        where: { event: ProLeadEvent.PLAN_CLICKED },
      }),
      this.proLeadEventRepository.count({
        where: { event: ProLeadEvent.CHECKOUT_REACHED },
      }),
      this.proLeadEventRepository
        .createQueryBuilder("lead")
        .select("DISTINCT lead.idUsers", "idUsers")
        .where("lead.event = :event", { event: ProLeadEvent.PLAN_CLICKED })
        .getRawMany<{ idUsers: string }>(),
      this.proLeadEventRepository
        .createQueryBuilder("lead")
        .select("DISTINCT lead.idUsers", "idUsers")
        .where("lead.event = :event", { event: ProLeadEvent.CHECKOUT_REACHED })
        .getRawMany<{ idUsers: string }>(),
    ]);

    const checkoutUserIds = uniqueCheckoutRaw.map((row) => row.idUsers);
    const convertedToProCount = checkoutUserIds.length
      ? await this.subscriptionRepository.count({
          where: {
            idUsers: In(checkoutUserIds),
            plan: SubscriptionPlan.PRO,
            status: In(ACTIVE_PRO_STATUSES),
          },
        })
      : 0;

    return {
      totalPlanClicks,
      totalCheckoutReached,
      uniqueUsersClicked: uniqueClickersRaw.length,
      uniqueUsersReachedCheckout: uniqueCheckoutRaw.length,
      convertedToProCount,
    };
  }

  async listProLeads(
    filter: AdminProLeadsFilter,
  ): Promise<PaginatedResult<AdminProLeadRow>> {
    const { page, limit, skip } = resolvePagination(filter.page, filter.limit);

    const [records, total] = await this.proLeadEventRepository.findAndCount({
      where: filter.eventType ? { event: filter.eventType } : {},
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    const userIds = records.map((record) => record.idUsers);
    const subscriptions = userIds.length
      ? await this.subscriptionRepository.findBy({ idUsers: In(userIds) })
      : [];
    const subscriptionByUser = new Map(
      subscriptions.map((subscription) => [subscription.idUsers, subscription]),
    );

    return {
      items: records.map((record): AdminProLeadRow => {
        const subscription = subscriptionByUser.get(record.idUsers);

        return {
          idProLeadEvent: record.idProLeadEvent,
          idUsers: record.idUsers,
          name: record.name,
          email: record.email,
          eventType: record.event,
          billingCycle: record.billingCycle,
          checkoutUrl: record.checkoutUrl,
          createdAt: record.createdAt,
          currentPlan: subscription?.plan ?? SubscriptionPlan.FREE,
          currentSubscriptionStatus: subscription?.status,
        };
      }),
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }

  // Every month between dateFrom and dateTo, inclusive, even ones with no
  // qualified referrals — a trend line needs a continuous axis, matching
  // GetMonthlyCashflowTrendUseCase's own version of this same helper.
  private enumerateMonths(from: Date, to: Date): string[] {
    const months: string[] = [];
    let year = from.getUTCFullYear();
    let month = from.getUTCMonth();
    const endYear = to.getUTCFullYear();
    const endMonth = to.getUTCMonth();

    while (year < endYear || (year === endYear && month <= endMonth)) {
      months.push(`${year}-${String(month + 1).padStart(2, "0")}`);
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }

    return months;
  }
}
