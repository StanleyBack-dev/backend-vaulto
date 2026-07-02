import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { DebtResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-response.dto";

export const CreateDebtMutationResponseDto = createDataResponseDto(
  DebtResponseDto,
  "CreateDebtMutationResponseDto",
);
