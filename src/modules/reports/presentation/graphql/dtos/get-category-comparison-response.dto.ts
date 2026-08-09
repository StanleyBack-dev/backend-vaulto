import { Field, ObjectType } from "@nestjs/graphql";
import type { CategoryComparisonView } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { CategoryComparisonGroupDto } from "@/modules/reports/presentation/graphql/dtos/category-comparison-group.dto";

@ObjectType()
export class CategoryComparisonResponseDto {
  static fromView(view: CategoryComparisonView): CategoryComparisonResponseDto {
    const dto = new CategoryComparisonResponseDto();
    dto.currentPeriodStart = view.currentPeriodStart;
    dto.currentPeriodEnd = view.currentPeriodEnd;
    dto.previousPeriodStart = view.previousPeriodStart;
    dto.previousPeriodEnd = view.previousPeriodEnd;
    dto.expenses = CategoryComparisonGroupDto.fromView(view.expenses);
    dto.income = CategoryComparisonGroupDto.fromView(view.income);
    return dto;
  }

  @Field(() => Date)
  currentPeriodStart!: Date;

  @Field(() => Date)
  currentPeriodEnd!: Date;

  @Field(() => Date)
  previousPeriodStart!: Date;

  @Field(() => Date)
  previousPeriodEnd!: Date;

  @Field(() => CategoryComparisonGroupDto)
  expenses!: CategoryComparisonGroupDto;

  @Field(() => CategoryComparisonGroupDto)
  income!: CategoryComparisonGroupDto;
}
