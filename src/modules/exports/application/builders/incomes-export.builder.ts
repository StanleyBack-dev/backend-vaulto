import { Inject, Injectable } from "@nestjs/common";
import { formatCurrencyBRL, formatDateBR } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
} from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { EXPORT_MAX_ROWS } from "../../domain/constants/export.constant";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  [IncomeStatus.PENDING]: "Pendente",
  [IncomeStatus.PARTIALLY_RECEIVED]: "Parcialmente recebida",
  [IncomeStatus.RECEIVED]: "Recebida",
  [IncomeStatus.OVERDUE]: "Vencida",
};

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  [IncomeType.FIXED]: "Fixa",
  [IncomeType.VARIABLE]: "Variável",
};

@Injectable()
export class IncomesExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.INCOMES;

  constructor(
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    const { records } = await this.incomeRepository.listByUser(userId, {
      limit: EXPORT_MAX_ROWS,
      dueDateFrom: filters.dueDateFrom,
      dueDateTo: filters.dueDateTo,
      status: filters.incomeStatus,
      incomeType: filters.incomeType,
      idCategory: filters.idCategory,
    });

    const rows = records.map((income) => [
      income.title,
      income.category,
      INCOME_TYPE_LABELS[income.incomeType],
      income.dueDate ? formatDateBR(income.dueDate) : "—",
      INCOME_STATUS_LABELS[income.status],
      formatCurrencyBRL(income.totalAmount),
    ]);

    const total = records.reduce((sum, income) => sum + income.totalAmount, 0);

    return {
      documentTitle: "Relatório de Receitas",
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Título", weight: 3 },
        { label: "Categoria", weight: 2 },
        { label: "Tipo", weight: 1, align: "center" },
        { label: "Vencimento", weight: 1, align: "center" },
        { label: "Status", weight: 1, align: "center" },
        { label: "Valor", weight: 1, align: "right" },
      ],
      rows,
      totals: records.length
        ? [{ label: "Total", value: formatCurrencyBRL(total) }]
        : [],
      emptyStateLabel:
        "Nenhuma receita encontrada para os filtros selecionados.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
