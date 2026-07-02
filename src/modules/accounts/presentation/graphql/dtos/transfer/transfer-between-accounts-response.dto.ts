import { Field, ObjectType } from "@nestjs/graphql";
import type { TransferBetweenAccountsResult } from "@/modules/accounts/application/ports/account-repository.port";
import { AccountResponseDto } from "@/modules/accounts/presentation/graphql/dtos/get/account-response.dto";
import { AccountTransferResponseDto } from "@/modules/accounts/presentation/graphql/dtos/transfer/account-transfer-response.dto";

@ObjectType()
export class TransferBetweenAccountsResponseDto {
  static fromView(view: TransferBetweenAccountsResult): TransferBetweenAccountsResponseDto {
    const dto = new TransferBetweenAccountsResponseDto();
    dto.sourceAccount = AccountResponseDto.fromView(view.sourceAccount);
    dto.destinationAccount = AccountResponseDto.fromView(view.destinationAccount);
    dto.transfer = AccountTransferResponseDto.fromView(view.transfer);
    return dto;
  }

  @Field(() => AccountResponseDto)
  sourceAccount!: AccountResponseDto;

  @Field(() => AccountResponseDto)
  destinationAccount!: AccountResponseDto;

  @Field(() => AccountTransferResponseDto)
  transfer!: AccountTransferResponseDto;
}
