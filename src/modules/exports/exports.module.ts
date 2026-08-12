import { Module } from "@nestjs/common";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { CategoriesModule } from "@/modules/categories/categories.module";
import { CreditCardsModule } from "@/modules/credit-cards/credit-cards.module";
import { DebtsModule } from "@/modules/debts/debts.module";
import { ExcelGeneratorModule } from "@/modules/excel-generator/excel-generator.module";
import { GoalsModule } from "@/modules/goals/goals.module";
import { IncomesModule } from "@/modules/incomes/incomes.module";
import { PdfGeneratorModule } from "@/modules/pdf-generator/pdf-generator.module";
import { CategoriesExportBuilder } from "./application/builders/categories-export.builder";
import { CreditCardsExportBuilder } from "./application/builders/credit-cards-export.builder";
import { DebtsExportBuilder } from "./application/builders/debts-export.builder";
import { GoalContributionsExportBuilder } from "./application/builders/goal-contributions-export.builder";
import { GoalsExportBuilder } from "./application/builders/goals-export.builder";
import { IncomeReceiptsExportBuilder } from "./application/builders/income-receipts-export.builder";
import { IncomesExportBuilder } from "./application/builders/incomes-export.builder";
import { PaymentsExportBuilder } from "./application/builders/payments-export.builder";
import { StatementExportBuilder } from "./application/builders/statement-export.builder";
import { ExportResourceUseCase } from "./application/use-cases/export-resource.use-case";
import { ExportsResolver } from "./presentation/graphql/resolvers/exports.resolver";

@Module({
  imports: [
    AuthModule,
    BillingModule,
    DebtsModule,
    IncomesModule,
    CreditCardsModule,
    CategoriesModule,
    GoalsModule,
    PdfGeneratorModule,
    ExcelGeneratorModule,
  ],
  providers: [
    DebtsExportBuilder,
    PaymentsExportBuilder,
    IncomesExportBuilder,
    IncomeReceiptsExportBuilder,
    CreditCardsExportBuilder,
    CategoriesExportBuilder,
    StatementExportBuilder,
    GoalsExportBuilder,
    GoalContributionsExportBuilder,
    ExportResourceUseCase,
    ExportsResolver,
  ],
})
export class ExportsModule {}
