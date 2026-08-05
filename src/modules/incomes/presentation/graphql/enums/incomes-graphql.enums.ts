import { registerEnumType } from "@nestjs/graphql";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

registerEnumType(IncomeType, {
  name: "IncomeType",
});

registerEnumType(IncomeStatus, {
  name: "IncomeStatus",
});
