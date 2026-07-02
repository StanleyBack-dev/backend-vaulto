import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetDebtByIdInputDto {
  @Field()
  idDebt!: string;
}
