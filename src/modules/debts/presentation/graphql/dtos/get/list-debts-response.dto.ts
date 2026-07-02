import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { DebtResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-response.dto";

export const ListDebtsResponseDto = createListResponseDto(
  DebtResponseDto,
  "ListDebtsResponseDto",
);
