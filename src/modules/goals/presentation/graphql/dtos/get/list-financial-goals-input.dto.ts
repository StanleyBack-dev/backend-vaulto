import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class ListFinancialGoalsInputDto {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;
}
