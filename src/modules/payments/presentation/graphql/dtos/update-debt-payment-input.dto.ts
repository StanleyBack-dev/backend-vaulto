import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateDebtPaymentInputDto {
  @Field()
  idDebtPayment!: string;

  @Field(() => Float, { nullable: true })
  amountPaid?: number;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;
}
