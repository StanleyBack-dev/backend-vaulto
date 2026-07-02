import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { TransactionResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transaction-response.dto";

export const CreateTransactionMutationResponseDto = createDataResponseDto(
  TransactionResponseDto,
  "CreateTransactionMutationResponse",
);
