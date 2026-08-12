import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { PdfTemplateEngineService } from "@/modules/pdf-generator/application/use-cases/pdf-template-engine.use-case";
import { PdfTemplateKey } from "@/modules/pdf-generator/domain/enums/pdf-template-key.enum";
import { RenderTabularWorkbookService } from "@/modules/excel-generator/application/use-cases/render-tabular-workbook.use-case";
import { ExportFormat } from "../../domain/enums/export-format.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import {
  EXPORT_FILE_EXTENSION_BY_FORMAT,
  EXPORT_MIME_TYPE_BY_FORMAT,
} from "../../domain/constants/export.constant";
import { CategoriesExportBuilder } from "../builders/categories-export.builder";
import { CreditCardsExportBuilder } from "../builders/credit-cards-export.builder";
import { DebtsExportBuilder } from "../builders/debts-export.builder";
import { GoalContributionsExportBuilder } from "../builders/goal-contributions-export.builder";
import { GoalsExportBuilder } from "../builders/goals-export.builder";
import { IncomeReceiptsExportBuilder } from "../builders/income-receipts-export.builder";
import { IncomesExportBuilder } from "../builders/incomes-export.builder";
import { PaymentsExportBuilder } from "../builders/payments-export.builder";
import { StatementExportBuilder } from "../builders/statement-export.builder";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const RESOURCE_FILE_SLUG: Record<ExportResource, string> = {
  [ExportResource.DEBTS]: "dividas",
  [ExportResource.PAYMENTS]: "pagamentos",
  [ExportResource.INCOMES]: "receitas",
  [ExportResource.INCOME_RECEIPTS]: "recebimentos",
  [ExportResource.CREDIT_CARDS]: "cartoes-de-credito",
  [ExportResource.CATEGORIES]: "categorias",
  [ExportResource.STATEMENT]: "extrato",
  [ExportResource.GOALS]: "metas",
  [ExportResource.GOAL_CONTRIBUTIONS]: "contribuicoes",
};

export interface ExportResourceInput {
  resource: ExportResource;
  format: ExportFormat;
  filters: ExportResourceFilters;
}

export interface ExportResourceOutput {
  filename: string;
  mimeType: string;
  base64: string;
}

@Injectable()
export class ExportResourceUseCase {
  private readonly registry: Map<ExportResource, TabularReportBuilder>;

  constructor(
    private readonly planLimitsService: PlanLimitsService,
    private readonly pdfTemplateEngine: PdfTemplateEngineService,
    private readonly workbookRenderer: RenderTabularWorkbookService,
    debtsExportBuilder: DebtsExportBuilder,
    paymentsExportBuilder: PaymentsExportBuilder,
    incomesExportBuilder: IncomesExportBuilder,
    incomeReceiptsExportBuilder: IncomeReceiptsExportBuilder,
    creditCardsExportBuilder: CreditCardsExportBuilder,
    categoriesExportBuilder: CategoriesExportBuilder,
    statementExportBuilder: StatementExportBuilder,
    goalsExportBuilder: GoalsExportBuilder,
    goalContributionsExportBuilder: GoalContributionsExportBuilder,
  ) {
    const builders: TabularReportBuilder[] = [
      debtsExportBuilder,
      paymentsExportBuilder,
      incomesExportBuilder,
      incomeReceiptsExportBuilder,
      creditCardsExportBuilder,
      categoriesExportBuilder,
      statementExportBuilder,
      goalsExportBuilder,
      goalContributionsExportBuilder,
    ];

    this.registry = new Map(
      builders.map((builder) => [builder.resource, builder]),
    );
  }

  async execute(
    userId: string,
    userLabel: string,
    input: ExportResourceInput,
  ): Promise<ExportResourceOutput> {
    await this.planLimitsService.assertProPlan(userId);

    const builder = this.registry.get(input.resource);
    if (!builder) {
      throw AppException.from(APP_ERRORS.exports.resourceNotMapped, undefined);
    }

    const payload = await builder.build(userId, userLabel, input.filters);

    const buffer =
      input.format === ExportFormat.PDF
        ? await this.pdfTemplateEngine.generateByTemplate({
            templateKey: PdfTemplateKey.FINANCIAL_TABLE,
            payload,
          })
        : await this.workbookRenderer.render(payload);

    const extension = EXPORT_FILE_EXTENSION_BY_FORMAT[input.format];
    const dateSlug = new Date().toISOString().slice(0, 10);

    return {
      filename: `${RESOURCE_FILE_SLUG[input.resource]}-${dateSlug}.${extension}`,
      mimeType: EXPORT_MIME_TYPE_BY_FORMAT[input.format],
      base64: buffer.toString("base64"),
    };
  }
}
