import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { CategoryComparisonGroupView } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { CategoryComparisonEntryDto } from "@/modules/reports/presentation/graphql/dtos/category-comparison-entry.dto";

@ObjectType()
export class CategoryComparisonGroupDto {
  static fromView(
    view: CategoryComparisonGroupView,
  ): CategoryComparisonGroupDto {
    const dto = new CategoryComparisonGroupDto();
    dto.currentTotal = view.currentTotal;
    dto.previousTotal = view.previousTotal;
    dto.changeAmount = view.changeAmount;
    dto.changePercent = view.changePercent;
    dto.categories = view.categories.map((entry) =>
      CategoryComparisonEntryDto.fromView(entry),
    );
    return dto;
  }

  @Field(() => Float)
  currentTotal!: number;

  @Field(() => Float)
  previousTotal!: number;

  @Field(() => Float)
  changeAmount!: number;

  @Field(() => Int, { nullable: true })
  changePercent!: number | null;

  @Field(() => [CategoryComparisonEntryDto])
  categories!: CategoryComparisonEntryDto[];
}
