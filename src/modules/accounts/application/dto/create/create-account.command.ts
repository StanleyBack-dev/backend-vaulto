import type { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

export type CreateAccountCommand = {
  name: string;
  accountType: AccountType;
  initialBalance: number;
};
