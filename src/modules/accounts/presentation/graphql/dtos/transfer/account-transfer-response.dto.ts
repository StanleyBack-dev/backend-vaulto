import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { AccountTransferView } from "@/modules/accounts/application/ports/account-repository.port";

@ObjectType()
export class AccountTransferResponseDto {
  static fromView(view: AccountTransferView): AccountTransferResponseDto {
    const dto = new AccountTransferResponseDto();
    dto.idAccountTransfer = view.idAccountTransfer;
    dto.idUsers = view.idUsers;
    dto.sourceAccountId = view.sourceAccountId;
    dto.destinationAccountId = view.destinationAccountId;
    dto.amount = view.amount;
    dto.description = view.description;
    dto.transferredAt = view.transferredAt;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field()
  idAccountTransfer!: string;

  @Field()
  idUsers!: string;

  @Field()
  sourceAccountId!: string;

  @Field()
  destinationAccountId!: string;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Date)
  transferredAt!: Date;

  @Field(() => Date)
  createdAt!: Date;
}
