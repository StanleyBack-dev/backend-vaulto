import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class GetFinancialHealthScoreInputDto {
  @Field(() => Date, { nullable: true })
  periodEnd?: Date;
}
