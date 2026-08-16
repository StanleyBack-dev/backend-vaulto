import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { CategoryAmountRow } from "@/modules/reports/application/ports/report-repository.port";

@ObjectType()
export class CategoryAmountResponseDto {
  static fromView(view: CategoryAmountRow): CategoryAmountResponseDto {
    const dto = new CategoryAmountResponseDto();
    dto.idCategory = view.idCategory;
    dto.categoryName = view.categoryName;
    dto.amount = view.amount;
    return dto;
  }

  @Field(() => String)
  idCategory!: string;

  @Field(() => String)
  categoryName!: string;

  @Field(() => Float)
  amount!: number;
}
