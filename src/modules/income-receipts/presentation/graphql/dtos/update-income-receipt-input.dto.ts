import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateIncomeReceiptInputDto {
  @Field()
  idIncomeReceipt!: string;

  @Field(() => Float, { nullable: true })
  amountReceived?: number;

  @Field(() => Date, { nullable: true })
  receivedAt?: Date;
}
