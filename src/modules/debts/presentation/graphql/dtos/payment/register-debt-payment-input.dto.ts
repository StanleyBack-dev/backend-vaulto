import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterDebtPaymentInputDto {
  @Field()
  idDebt!: string;

  @Field(() => Float)
  amountPaid!: number;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;
}
