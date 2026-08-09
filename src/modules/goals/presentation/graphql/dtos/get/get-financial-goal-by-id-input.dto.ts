import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetFinancialGoalByIdInputDto {
  @Field()
  idFinancialGoal!: string;
}
