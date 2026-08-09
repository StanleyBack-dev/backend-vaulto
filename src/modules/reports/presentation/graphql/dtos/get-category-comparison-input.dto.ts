import { Field, InputType } from "@nestjs/graphql";
import { CategoryComparisonPeriodType } from "@/modules/reports/domain/enums/category-comparison-period-type.enum";

@InputType()
export class GetCategoryComparisonInputDto {
  @Field(() => CategoryComparisonPeriodType, { nullable: true })
  periodType?: CategoryComparisonPeriodType;

  @Field(() => Date, { nullable: true })
  referenceDate?: Date;

  @Field(() => Date, { nullable: true })
  comparisonDate?: Date;
}
