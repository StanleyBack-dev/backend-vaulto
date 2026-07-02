import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { TransactionResponseDto } from "@/modules/transactions/presentation/graphql/dtos/get/transaction-response.dto";

export const ListTransactionsResponseDto = createListResponseDto(
  TransactionResponseDto,
  "ListTransactionsResponse",
);
