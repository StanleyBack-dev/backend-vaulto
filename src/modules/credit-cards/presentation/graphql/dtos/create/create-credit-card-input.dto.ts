import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CreateCreditCardInputDto {
  @Field()
  name!: string;

  @Field(() => Float)
  creditLimit!: number;

  @Field(() => Int)
  dueDay!: number;

  @Field(() => Int)
  closingDay!: number;

  @Field({ nullable: true })
  status?: boolean;
}
