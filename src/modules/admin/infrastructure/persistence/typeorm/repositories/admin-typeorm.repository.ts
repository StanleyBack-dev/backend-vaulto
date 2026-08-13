import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type {
  AdminDashboardStatsView,
  AdminRepositoryPort,
} from "@/modules/admin/application/ports/admin-repository.port";
import { PRO_PLAN_PRICES } from "@/modules/billing/domain/constants/pro-plan.constant";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";
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

@Injectable()
export class AdminTypeormRepository implements AdminRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SupportMessageEntity)
    private readonly supportMessageRepository: Repository<SupportMessageEntity>,
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
}
