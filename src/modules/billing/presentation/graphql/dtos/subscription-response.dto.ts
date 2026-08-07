import { Field, ObjectType } from "@nestjs/graphql";
import type { SubscriptionView } from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

@ObjectType()
export class SubscriptionResponseDto {
  static fromView(view: SubscriptionView): SubscriptionResponseDto {
    const dto = new SubscriptionResponseDto();
    dto.plan = view.plan;
    dto.status = view.status;
    dto.trialEndsAt = view.trialEndsAt;
    dto.currentPeriodEnd = view.currentPeriodEnd;
    dto.cancelAtPeriodEnd = view.cancelAtPeriodEnd;
    return dto;
  }

  @Field(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  @Field(() => SubscriptionStatus)
  status!: SubscriptionStatus;

  @Field(() => Date, { nullable: true })
  trialEndsAt?: Date;

  @Field(() => Date, { nullable: true })
  currentPeriodEnd?: Date;

  @Field()
  cancelAtPeriodEnd!: boolean;
}
