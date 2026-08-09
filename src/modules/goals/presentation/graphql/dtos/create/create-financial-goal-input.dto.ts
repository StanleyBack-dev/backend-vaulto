import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class CreateFinancialGoalInputDto {
  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  targetAmount!: number;

  @Field(() => Date, { nullable: true })
  targetDate?: Date;
}
