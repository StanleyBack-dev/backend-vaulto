import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import type { CategoryComparisonEntry } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";

@ObjectType()
export class CategoryComparisonEntryDto {
  static fromView(view: CategoryComparisonEntry): CategoryComparisonEntryDto {
    const dto = new CategoryComparisonEntryDto();
    dto.idCategory = view.idCategory;
    dto.categoryName = view.categoryName;
    dto.currentAmount = view.currentAmount;
    dto.previousAmount = view.previousAmount;
    dto.changeAmount = view.changeAmount;
    dto.changePercent = view.changePercent;
    return dto;
  }

  @Field()
  idCategory!: string;

  @Field()
  categoryName!: string;

  @Field(() => Float)
  currentAmount!: number;

  @Field(() => Float)
  previousAmount!: number;

  @Field(() => Float)
  changeAmount!: number;

  @Field(() => Int, { nullable: true })
  changePercent!: number | null;
}
