import { registerEnumType } from "@nestjs/graphql";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

registerEnumType(SubscriptionPlan, {
  name: "SubscriptionPlan",
});

registerEnumType(SubscriptionStatus, {
  name: "SubscriptionStatus",
});

registerEnumType(SubscriptionBillingCycle, {
  name: "SubscriptionBillingCycle",
});
