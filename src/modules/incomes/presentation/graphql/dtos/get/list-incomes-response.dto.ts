import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { IncomeResponseDto } from "@/modules/incomes/presentation/graphql/dtos/get/income-response.dto";

export const ListIncomesResponseDto = createListResponseDto(
  IncomeResponseDto,
  "ListIncomesResponseDto",
);
