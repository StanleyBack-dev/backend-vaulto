import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { AdminDashboardStatsView } from "@/modules/admin/application/ports/admin-repository.port";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@ObjectType()
class UsersByGroupCountDto {
  @Field(() => UserGroup)
  group!: UserGroup;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
class SubscriptionsByStatusCountDto {
  @Field(() => SubscriptionStatus)
  status!: SubscriptionStatus;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class AdminDashboardStatsResponseDto {
  static fromView(
    view: AdminDashboardStatsView,
  ): AdminDashboardStatsResponseDto {
    const dto = new AdminDashboardStatsResponseDto();
    dto.totalUsers = view.totalUsers;
    dto.usersByGroup = view.usersByGroup;
    dto.totalSubscriptions = view.totalSubscriptions;
    dto.freeSubscriptions = view.freeSubscriptions;
    dto.activeProSubscriptions = view.activeProSubscriptions;
    dto.subscriptionsByStatus = view.subscriptionsByStatus;
    dto.estimatedMonthlyRecurringRevenue =
      view.estimatedMonthlyRecurringRevenue;
    dto.totalSupportTickets = view.totalSupportTickets;
    dto.openSupportTickets = view.openSupportTickets;
    dto.resolvedSupportTickets = view.resolvedSupportTickets;
    return dto;
  }

  @Field(() => Int)
  totalUsers!: number;

  @Field(() => [UsersByGroupCountDto])
  usersByGroup!: UsersByGroupCountDto[];

  @Field(() => Int)
  totalSubscriptions!: number;

  @Field(() => Int)
  freeSubscriptions!: number;

  @Field(() => Int)
  activeProSubscriptions!: number;

  @Field(() => [SubscriptionsByStatusCountDto])
  subscriptionsByStatus!: SubscriptionsByStatusCountDto[];

  @Field(() => Float)
  estimatedMonthlyRecurringRevenue!: number;

  @Field(() => Int)
  totalSupportTickets!: number;

  @Field(() => Int)
  openSupportTickets!: number;

  @Field(() => Int)
  resolvedSupportTickets!: number;
}
