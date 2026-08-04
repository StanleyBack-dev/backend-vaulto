import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateCreditCardInputDto {
  @Field()
  idCreditCard!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  creditLimit!: number;

  @Field(() => Int)
  dueDay!: number;

  @Field(() => Int)
  closingDay!: number;

  @Field()
  status!: boolean;
}
