import { Field, Float, InputType } from "@nestjs/graphql";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

@InputType()
export class CreateAccountInputDto {
  @Field()
  name!: string;

  @Field(() => AccountType)
  accountType!: AccountType;

  @Field(() => Float)
  initialBalance!: number;
}
