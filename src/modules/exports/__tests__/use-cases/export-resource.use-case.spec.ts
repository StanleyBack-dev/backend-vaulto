import { AppException } from "@/common/exceptions/app-exception";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import { ExportFormat } from "../../domain/enums/export-format.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { ExportResourceUseCase } from "../../application/use-cases/export-resource.use-case";

function payload(): TabularReportPayload {
  return {
    documentTitle: "Relatório de Dívidas",
    generatedAtLabel: "Gerado em 10 de agosto de 2026 às 10:00",
    userLabel: "Stanley",
    columns: [{ label: "Título", weight: 1 }],
    rows: [["Cartão"]],
    totals: [],
    emptyStateLabel: "Nada encontrado.",
    referenceCode: "EXP-DEBTS-1",
  };
}

function stubBuilder(resource: ExportResource) {
  return { resource, build: jest.fn().mockResolvedValue(payload()) };
}

function buildUseCase() {
  const planLimitsService = {
    assertProPlan: jest.fn().mockResolvedValue(undefined),
  };
  const pdfTemplateEngine = {
    generateByTemplate: jest.fn().mockResolvedValue(Buffer.from("pdf-bytes")),
  };
  const workbookRenderer = {
    render: jest.fn().mockResolvedValue(Buffer.from("xlsx-bytes")),
  };
  const debtsBuilder = stubBuilder(ExportResource.DEBTS);
  const paymentsBuilder = stubBuilder(ExportResource.PAYMENTS);
  const incomesBuilder = stubBuilder(ExportResource.INCOMES);
  const incomeReceiptsBuilder = stubBuilder(ExportResource.INCOME_RECEIPTS);
  const creditCardsBuilder = stubBuilder(ExportResource.CREDIT_CARDS);
  const categoriesBuilder = stubBuilder(ExportResource.CATEGORIES);
  const statementBuilder = stubBuilder(ExportResource.STATEMENT);
  const goalsBuilder = stubBuilder(ExportResource.GOALS);
  const goalContributionsBuilder = stubBuilder(
    ExportResource.GOAL_CONTRIBUTIONS,
  );

  const useCase = new ExportResourceUseCase(
    planLimitsService as never,
    pdfTemplateEngine as never,
    workbookRenderer as never,
    debtsBuilder as never,
    paymentsBuilder as never,
    incomesBuilder as never,
    incomeReceiptsBuilder as never,
    creditCardsBuilder as never,
    categoriesBuilder as never,
    statementBuilder as never,
    goalsBuilder as never,
    goalContributionsBuilder as never,
  );

  return {
    useCase,
    planLimitsService,
    pdfTemplateEngine,
    workbookRenderer,
    debtsBuilder,
  };
}

describe("ExportResourceUseCase", () => {
  it("rejects when the user is not on the Pro plan", async () => {
    const { useCase, planLimitsService, debtsBuilder } = buildUseCase();
    planLimitsService.assertProPlan.mockRejectedValue(
      new AppException({ code: "X", status: 403, message: "no" }, "no"),
    );

    await expect(
      useCase.execute("user-1", "Stanley", {
        resource: ExportResource.DEBTS,
        format: ExportFormat.PDF,
        filters: {},
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(debtsBuilder.build).not.toHaveBeenCalled();
  });

  it("renders through the PDF engine and base64-encodes the result", async () => {
    const { useCase, pdfTemplateEngine, workbookRenderer } = buildUseCase();

    const result = await useCase.execute("user-1", "Stanley", {
      resource: ExportResource.DEBTS,
      format: ExportFormat.PDF,
      filters: {},
    });

    expect(pdfTemplateEngine.generateByTemplate).toHaveBeenCalled();
    expect(workbookRenderer.render).not.toHaveBeenCalled();
    expect(result.mimeType).toBe("application/pdf");
    expect(result.filename).toMatch(/^dividas-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(result.base64).toBe(Buffer.from("pdf-bytes").toString("base64"));
  });

  it("renders through the workbook renderer for XLSX", async () => {
    const { useCase, pdfTemplateEngine, workbookRenderer } = buildUseCase();

    const result = await useCase.execute("user-1", "Stanley", {
      resource: ExportResource.GOALS,
      format: ExportFormat.XLSX,
      filters: {},
    });

    expect(workbookRenderer.render).toHaveBeenCalled();
    expect(pdfTemplateEngine.generateByTemplate).not.toHaveBeenCalled();
    expect(result.mimeType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(result.filename).toMatch(/^metas-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});
