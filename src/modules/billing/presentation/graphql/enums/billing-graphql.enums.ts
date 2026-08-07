import { registerEnumType } from "@nestjs/graphql";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

registerEnumType(SubscriptionPlan, {
  name: "SubscriptionPlan",
});

registerEnumType(SubscriptionStatus, {
  name: "SubscriptionStatus",
});
