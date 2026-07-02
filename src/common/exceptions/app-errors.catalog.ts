import type { AppErrorDefinition } from "@/common/exceptions/app-error-definition.type";
import { accountsErrors } from "@/common/exceptions/catalogs/accounts-errors.catalog";
import { authErrors } from "@/common/exceptions/catalogs/auth-errors.catalog";
import { authorizationErrors } from "@/common/exceptions/catalogs/authorization-errors.catalog";
import { debtsErrors } from "@/common/exceptions/catalogs/debts-errors.catalog";
import { mailsErrors } from "@/common/exceptions/catalogs/mails-errors.catalog";
import { pdfErrors } from "@/common/exceptions/catalogs/pdf-errors.catalog";
import { profilesErrors } from "@/common/exceptions/catalogs/profiles-errors.catalog";
import { transactionsErrors } from "@/common/exceptions/catalogs/transactions-errors.catalog";
import { usersErrors } from "@/common/exceptions/catalogs/users-errors.catalog";
import { validationErrors } from "@/common/exceptions/catalogs/validation-errors.catalog";

export const APP_ERRORS = {
  auth: authErrors,
  accounts: accountsErrors,
  authorization: authorizationErrors,
  users: usersErrors,
  profiles: profilesErrors,
  transactions: transactionsErrors,
  debts: debtsErrors,
  mails: mailsErrors,
  pdf: pdfErrors,
  validation: validationErrors,
} as const satisfies Record<string, Record<string, AppErrorDefinition<never>>>;
