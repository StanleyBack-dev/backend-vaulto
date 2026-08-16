import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateFinancialGoalInputDto {
  @Field()
  idFinancialGoal!: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  targetAmount?: number;

  @Field(() => Date, { nullable: true })
  targetDate?: Date;
}
