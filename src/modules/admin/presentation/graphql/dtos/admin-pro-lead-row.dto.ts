import { Field, ObjectType } from "@nestjs/graphql";
import type { AdminProLeadRow } from "@/modules/admin/application/ports/admin-repository.port";
import { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

@ObjectType()
export class AdminProLeadRowDto {
  static fromView(view: AdminProLeadRow): AdminProLeadRowDto {
    const dto = new AdminProLeadRowDto();
    dto.idProLeadEvent = view.idProLeadEvent;
    dto.idUsers = view.idUsers;
    dto.name = view.name;
    dto.email = view.email;
    dto.eventType = view.eventType;
    dto.billingCycle = view.billingCycle ?? undefined;
    dto.checkoutUrl = view.checkoutUrl ?? undefined;
    dto.createdAt = view.createdAt;
    dto.currentPlan = view.currentPlan;
    dto.currentSubscriptionStatus = view.currentSubscriptionStatus;
    return dto;
  }

  @Field()
  idProLeadEvent!: string;

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => ProLeadEvent)
  eventType!: ProLeadEvent;

  @Field(() => SubscriptionBillingCycle, { nullable: true })
  billingCycle?: string;

  @Field({ nullable: true })
  checkoutUrl?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => SubscriptionPlan)
  currentPlan!: SubscriptionPlan;

  @Field(() => SubscriptionStatus, { nullable: true })
  currentSubscriptionStatus?: SubscriptionStatus;
}
