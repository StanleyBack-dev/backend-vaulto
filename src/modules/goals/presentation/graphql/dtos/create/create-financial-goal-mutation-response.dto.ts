import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { FinancialGoalResponseDto } from "@/modules/goals/presentation/graphql/dtos/get/financial-goal-response.dto";

export const CreateFinancialGoalMutationResponseDto = createDataResponseDto(
  FinancialGoalResponseDto,
  "CreateFinancialGoalMutationResponseDto",
);
