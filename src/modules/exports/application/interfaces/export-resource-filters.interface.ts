import type { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import type { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import type { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import type { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import type { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import type { StatementScope } from "../../domain/enums/statement-scope.enum";

export interface ExportResourceFilters {
  dueDateFrom?: Date;
  dueDateTo?: Date;
  idDebt?: string;
  idIncome?: string;
  idFinancialGoal?: string;
  statementScope?: StatementScope;
  debtStatus?: DebtStatus;
  incomeStatus?: IncomeStatus;
  debtType?: DebtType;
  incomeType?: IncomeType;
  idCategory?: string;
  categoryType?: CategoryType;
  /** Credit cards / categories active flag: undefined = all, true/false = only active/inactive. */
  activeOnly?: boolean;
}
