import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterGoalContributionInputDto {
  @Field()
  idFinancialGoal!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => Date, { nullable: true })
  contributedAt?: Date;

  @Field({ nullable: true })
  note?: string;
}
