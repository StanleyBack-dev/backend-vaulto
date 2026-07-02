import { registerEnumType } from "@nestjs/graphql";
import { TransactionType } from "@/modules/transactions/domain/enums/transaction-type.enum";

registerEnumType(TransactionType, {
  name: "TransactionType",
  description: "Tipo de movimentacao financeira",
});
