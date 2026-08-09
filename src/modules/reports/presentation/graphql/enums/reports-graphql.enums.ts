import { registerEnumType } from "@nestjs/graphql";
import { CategoryComparisonPeriodType } from "@/modules/reports/domain/enums/category-comparison-period-type.enum";

registerEnumType(CategoryComparisonPeriodType, {
  name: "CategoryComparisonPeriodType",
});
