import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { GoalContributionView } from "@/modules/goals/application/ports/financial-goal-repository.port";

@ObjectType()
export class GoalContributionResponseDto {
  static fromView(view: GoalContributionView): GoalContributionResponseDto {
    const dto = new GoalContributionResponseDto();
    dto.idGoalContribution = view.idGoalContribution;
    dto.idFinancialGoal = view.idFinancialGoal;
    dto.amount = view.amount;
    dto.contributedAt = view.contributedAt;
    dto.note = view.note;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field()
  idGoalContribution!: string;

  @Field()
  idFinancialGoal!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => Date)
  contributedAt!: Date;

  @Field({ nullable: true })
  note?: string;

  @Field(() => Date)
  createdAt!: Date;
}
