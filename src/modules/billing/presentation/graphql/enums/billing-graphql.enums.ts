import { registerEnumType } from "@nestjs/graphql";
import { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

registerEnumType(CancellationReason, {
  name: "CancellationReason",
});

registerEnumType(SubscriptionPlan, {
  name: "SubscriptionPlan",
});

registerEnumType(SubscriptionStatus, {
  name: "SubscriptionStatus",
});

registerEnumType(SubscriptionBillingCycle, {
  name: "SubscriptionBillingCycle",
});

registerEnumType(BillingPaymentStatus, {
  name: "BillingPaymentStatus",
});

registerEnumType(ProLeadEvent, {
  name: "ProLeadEvent",
});
