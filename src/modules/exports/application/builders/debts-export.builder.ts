import { Inject, Injectable } from "@nestjs/common";
import { formatCurrencyBRL, formatDateBR } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
} from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { EXPORT_MAX_ROWS } from "../../domain/constants/export.constant";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  [DebtStatus.OPEN]: "Em aberto",
  [DebtStatus.PARTIALLY_PAID]: "Parcialmente paga",
  [DebtStatus.PAID]: "Paga",
  [DebtStatus.OVERDUE]: "Vencida",
};

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  [DebtType.FIXED]: "Fixa",
  [DebtType.VARIABLE]: "Variável",
};

@Injectable()
export class DebtsExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.DEBTS;

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    const { records } = await this.debtRepository.listByUser(userId, {
      limit: EXPORT_MAX_ROWS,
      dueDateFrom: filters.dueDateFrom,
      dueDateTo: filters.dueDateTo,
      status: filters.debtStatus,
      debtType: filters.debtType,
      idCategory: filters.idCategory,
    });

    const rows = records.map((debt) => [
      debt.title,
      debt.category,
      debt.creditCard ?? "—",
      DEBT_TYPE_LABELS[debt.debtType],
      debt.dueDate ? formatDateBR(debt.dueDate) : "—",
      DEBT_STATUS_LABELS[debt.status],
      formatCurrencyBRL(debt.totalAmount),
    ]);

    const total = records.reduce((sum, debt) => sum + debt.totalAmount, 0);

    return {
      documentTitle: "Relatório de Dívidas",
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Título", weight: 3 },
        { label: "Categoria", weight: 2 },
        { label: "Cartão", weight: 2 },
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
        "Nenhuma dívida encontrada para os filtros selecionados.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
