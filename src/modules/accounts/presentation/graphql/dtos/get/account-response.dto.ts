import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { AccountView } from "@/modules/accounts/application/ports/account-repository.port";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

@ObjectType()
export class AccountResponseDto {
  static fromView(view: AccountView): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.idAccount = view.idAccount;
    dto.idUsers = view.idUsers;
    dto.name = view.name;
    dto.accountType = view.accountType;
    dto.initialBalance = view.initialBalance;
    dto.currentBalance = view.currentBalance;
    dto.isActive = view.isActive;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idAccount!: string;

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field(() => AccountType)
  accountType!: AccountType;

  @Field(() => Float)
  initialBalance!: number;

  @Field(() => Float)
  currentBalance!: number;

  @Field()
  isActive!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
