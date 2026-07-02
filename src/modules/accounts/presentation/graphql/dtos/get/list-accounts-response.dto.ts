import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { AccountResponseDto } from "@/modules/accounts/presentation/graphql/dtos/get/account-response.dto";

export const ListAccountsResponseDto = createListResponseDto(
  AccountResponseDto,
  "ListAccountsResponseDto",
);
