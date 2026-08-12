import { Field, InputType } from "@nestjs/graphql";
import { ExportFormat } from "@/modules/exports/domain/enums/export-format.enum";
import { ExportResource } from "@/modules/exports/domain/enums/export-resource.enum";
import { StatementScope } from "@/modules/exports/domain/enums/statement-scope.enum";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

@InputType()
export class ExportResourceInputDto {
  @Field(() => ExportResource)
  resource!: ExportResource;

  @Field(() => ExportFormat)
  format!: ExportFormat;

  @Field(() => Date, { nullable: true })
  dueDateFrom?: Date;

  @Field(() => Date, { nullable: true })
  dueDateTo?: Date;

  @Field({ nullable: true })
  idDebt?: string;

  @Field({ nullable: true })
  idIncome?: string;

  @Field({ nullable: true })
  idFinancialGoal?: string;

  @Field(() => StatementScope, { nullable: true })
  statementScope?: StatementScope;

  @Field(() => DebtStatus, { nullable: true })
  debtStatus?: DebtStatus;

  @Field(() => DebtType, { nullable: true })
  debtType?: DebtType;

  @Field(() => IncomeStatus, { nullable: true })
  incomeStatus?: IncomeStatus;

  @Field(() => IncomeType, { nullable: true })
  incomeType?: IncomeType;

  @Field({ nullable: true })
  idCategory?: string;

  @Field(() => CategoryType, { nullable: true })
  categoryType?: CategoryType;

  @Field({ nullable: true })
  activeOnly?: boolean;
}
