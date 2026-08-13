import type { AppErrorDefinition } from "@/common/exceptions/app-error-definition.type";
import { authErrors } from "@/common/exceptions/catalogs/auth-errors.catalog";
import { authorizationErrors } from "@/common/exceptions/catalogs/authorization-errors.catalog";
import { billingErrors } from "@/common/exceptions/catalogs/billing-errors.catalog";
import { categoriesErrors } from "@/common/exceptions/catalogs/categories-errors.catalog";
import { creditCardsErrors } from "@/common/exceptions/catalogs/credit-cards-errors.catalog";
import { debtsErrors } from "@/common/exceptions/catalogs/debts-errors.catalog";
import { exportsErrors } from "@/common/exceptions/catalogs/exports-errors.catalog";
import { goalsErrors } from "@/common/exceptions/catalogs/goals-errors.catalog";
import { incomeReceiptsErrors } from "@/common/exceptions/catalogs/income-receipts-errors.catalog";
import { incomesErrors } from "@/common/exceptions/catalogs/incomes-errors.catalog";
import { internalErrors } from "@/common/exceptions/catalogs/internal-errors.catalog";
import { mailsErrors } from "@/common/exceptions/catalogs/mails-errors.catalog";
import { paymentsErrors } from "@/common/exceptions/catalogs/payments-errors.catalog";
import { pdfErrors } from "@/common/exceptions/catalogs/pdf-errors.catalog";
import { profilesErrors } from "@/common/exceptions/catalogs/profiles-errors.catalog";
import { rateLimitErrors } from "@/common/exceptions/catalogs/rate-limit-errors.catalog";
import { supportErrors } from "@/common/exceptions/catalogs/support-errors.catalog";
import { usersErrors } from "@/common/exceptions/catalogs/users-errors.catalog";
import { validationErrors } from "@/common/exceptions/catalogs/validation-errors.catalog";

export const APP_ERRORS = {
  auth: authErrors,
  authorization: authorizationErrors,
  billing: billingErrors,
  categories: categoriesErrors,
  creditCards: creditCardsErrors,
  users: usersErrors,
  profiles: profilesErrors,
  debts: debtsErrors,
  exports: exportsErrors,
  goals: goalsErrors,
  incomes: incomesErrors,
  incomeReceipts: incomeReceiptsErrors,
  payments: paymentsErrors,
  mails: mailsErrors,
  pdf: pdfErrors,
  support: supportErrors,
  validation: validationErrors,
  rateLimit: rateLimitErrors,
  internal: internalErrors,
} as const satisfies Record<string, Record<string, AppErrorDefinition<never>>>;
