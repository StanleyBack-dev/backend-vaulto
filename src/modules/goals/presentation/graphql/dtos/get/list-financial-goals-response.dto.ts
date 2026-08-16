import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { FinancialGoalResponseDto } from "@/modules/goals/presentation/graphql/dtos/get/financial-goal-response.dto";

export const ListFinancialGoalsResponseDto = createListResponseDto(
  FinancialGoalResponseDto,
  "ListFinancialGoalsResponseDto",
);
