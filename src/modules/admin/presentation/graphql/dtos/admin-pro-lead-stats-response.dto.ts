import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { AdminProLeadStatsView } from "@/modules/admin/application/ports/admin-repository.port";

@ObjectType()
export class AdminProLeadStatsResponseDto {
  static fromView(view: AdminProLeadStatsView): AdminProLeadStatsResponseDto {
    const dto = new AdminProLeadStatsResponseDto();
    dto.totalPlanClicks = view.totalPlanClicks;
    dto.totalCheckoutReached = view.totalCheckoutReached;
    dto.uniqueUsersClicked = view.uniqueUsersClicked;
    dto.uniqueUsersReachedCheckout = view.uniqueUsersReachedCheckout;
    dto.convertedToProCount = view.convertedToProCount;
    return dto;
  }

  @Field(() => Int)
  totalPlanClicks!: number;

  @Field(() => Int)
  totalCheckoutReached!: number;

  @Field(() => Int)
  uniqueUsersClicked!: number;

  @Field(() => Int)
  uniqueUsersReachedCheckout!: number;

  @Field(() => Int)
  convertedToProCount!: number;
}
