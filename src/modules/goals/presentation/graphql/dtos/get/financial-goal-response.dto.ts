import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";
import { computeGoalProgress } from "@/modules/goals/domain/services/goal-progress.service";
import { FinancialGoalStatus } from "@/modules/goals/domain/enums/financial-goal-status.enum";
import { GoalContributionResponseDto } from "@/modules/goals/presentation/graphql/dtos/get/goal-contribution-response.dto";

@ObjectType()
export class FinancialGoalResponseDto {
  static fromView(view: FinancialGoalView): FinancialGoalResponseDto {
    const progress = computeGoalProgress({
      targetAmount: view.targetAmount,
      currentAmount: view.currentAmount,
      createdAt: view.createdAt,
    });

    const dto = new FinancialGoalResponseDto();
    dto.idFinancialGoal = view.idFinancialGoal;
    dto.idUsers = view.idUsers;
    dto.title = view.title;
    dto.description = view.description;
    dto.targetAmount = view.targetAmount;
    dto.currentAmount = view.currentAmount;
    dto.targetDate = view.targetDate;
    dto.status = progress.status;
    dto.progressPercent = progress.progressPercent;
    dto.estimatedMonthsToComplete = progress.estimatedMonthsToComplete;
    dto.contributions = view.contributions.map((contribution) =>
      GoalContributionResponseDto.fromView(contribution),
    );
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idFinancialGoal!: string;

  @Field()
  idUsers!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  targetAmount!: number;

  @Field(() => Float)
  currentAmount!: number;

  @Field(() => Date, { nullable: true })
  targetDate?: Date;

  @Field(() => FinancialGoalStatus)
  status!: FinancialGoalStatus;

  @Field(() => Int)
  progressPercent!: number;

  @Field(() => Int, { nullable: true })
  estimatedMonthsToComplete!: number | null;

  @Field(() => [GoalContributionResponseDto])
  contributions!: GoalContributionResponseDto[];

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
