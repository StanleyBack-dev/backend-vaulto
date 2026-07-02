import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class TransferBetweenAccountsInputDto {
  @Field()
  sourceAccountId!: string;

  @Field()
  destinationAccountId!: string;

  @Field(() => Float)
  amount!: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Date, { nullable: true })
  transferredAt?: Date;
}
