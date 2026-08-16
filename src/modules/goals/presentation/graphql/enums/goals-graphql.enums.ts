import { registerEnumType } from "@nestjs/graphql";
import { FinancialGoalStatus } from "@/modules/goals/domain/enums/financial-goal-status.enum";

registerEnumType(FinancialGoalStatus, {
  name: "FinancialGoalStatus",
});
