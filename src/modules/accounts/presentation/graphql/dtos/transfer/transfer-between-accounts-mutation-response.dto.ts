import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { TransferBetweenAccountsResponseDto } from "@/modules/accounts/presentation/graphql/dtos/transfer/transfer-between-accounts-response.dto";

export const TransferBetweenAccountsMutationResponseDto = createDataResponseDto(
  TransferBetweenAccountsResponseDto,
  "TransferBetweenAccountsMutationResponse",
);
