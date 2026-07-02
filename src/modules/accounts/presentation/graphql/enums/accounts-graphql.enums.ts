import { registerEnumType } from "@nestjs/graphql";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

registerEnumType(AccountType, {
  name: "AccountType",
});
