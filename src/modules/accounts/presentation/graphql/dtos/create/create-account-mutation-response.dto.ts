import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { AccountResponseDto } from "@/modules/accounts/presentation/graphql/dtos/get/account-response.dto";

export const CreateAccountMutationResponseDto = createDataResponseDto(
  AccountResponseDto,
  "CreateAccountMutationResponseDto",
);
