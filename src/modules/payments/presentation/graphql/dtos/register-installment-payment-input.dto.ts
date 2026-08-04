import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterInstallmentPaymentInputDto {
  @Field()
  idDebt!: string;

  @Field()
  idDebtInstallment!: string;

  @Field(() => Float)
  amountPaid!: number;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;
}
