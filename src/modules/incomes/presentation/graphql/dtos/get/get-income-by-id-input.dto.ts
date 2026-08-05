import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetIncomeByIdInputDto {
  @Field()
  idIncome!: string;
}
