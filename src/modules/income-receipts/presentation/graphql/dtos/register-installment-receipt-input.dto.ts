import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterInstallmentReceiptInputDto {
  @Field()
  idIncome!: string;

  @Field()
  idIncomeInstallment!: string;

  @Field(() => Float)
  amountReceived!: number;

  @Field(() => Date, { nullable: true })
  receivedAt?: Date;
}
