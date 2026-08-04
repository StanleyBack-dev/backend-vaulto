import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetCreditCardByIdInputDto {
  @Field()
  idCreditCard!: string;
}
