import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateGoalContributionInputDto {
  @Field()
  idFinancialGoal!: string;

  @Field()
  idGoalContribution!: string;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field(() => Date, { nullable: true })
  contributedAt?: Date;

  @Field({ nullable: true })
  note?: string;
}
