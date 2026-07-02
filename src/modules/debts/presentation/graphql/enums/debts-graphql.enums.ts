import { registerEnumType } from "@nestjs/graphql";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

registerEnumType(DebtType, {
  name: "DebtType",
});

registerEnumType(DebtStatus, {
  name: "DebtStatus",
});
