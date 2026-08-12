import { registerEnumType } from "@nestjs/graphql";
import { CategoryComparisonPeriodType } from "@/modules/reports/domain/enums/category-comparison-period-type.enum";
import { FinancialHealthStatus } from "@/modules/reports/domain/enums/financial-health-status.enum";

registerEnumType(CategoryComparisonPeriodType, {
  name: "CategoryComparisonPeriodType",
});

registerEnumType(FinancialHealthStatus, {
  name: "FinancialHealthStatus",
});
