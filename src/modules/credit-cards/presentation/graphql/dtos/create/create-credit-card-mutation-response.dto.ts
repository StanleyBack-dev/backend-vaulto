import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { CreditCardResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/credit-card-response.dto";

export const CreateCreditCardMutationResponseDto = createDataResponseDto(
  CreditCardResponseDto,
  "CreateCreditCardMutationResponseDto",
);
