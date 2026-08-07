import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";

export const FREE_PLAN_LIMITS: Record<PlanLimitedResource, number> = {
  [PlanLimitedResource.DEBTS]: 5,
  [PlanLimitedResource.CREDIT_CARDS]: 1,
  [PlanLimitedResource.INCOMES]: 10,
};
