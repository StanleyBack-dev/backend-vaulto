import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { IncomeResponseDto } from "@/modules/incomes/presentation/graphql/dtos/get/income-response.dto";

export const CreateIncomeMutationResponseDto = createDataResponseDto(
  IncomeResponseDto,
  "CreateIncomeMutationResponseDto",
);
