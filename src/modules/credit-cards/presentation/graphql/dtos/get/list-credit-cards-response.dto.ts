import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { CreditCardResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/credit-card-response.dto";

export const ListCreditCardsResponseDto = createListResponseDto(
  CreditCardResponseDto,
  "ListCreditCardsResponseDto",
);
