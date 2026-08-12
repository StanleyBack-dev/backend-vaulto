import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { formatCurrencyBRL, formatDateBR } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
} from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import { formatLocalTimestampBR } from "../utils/format-local-timestamp.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  [IncomeStatus.PENDING]: "Pendente",
  [IncomeStatus.PARTIALLY_RECEIVED]: "Parcialmente recebida",
  [IncomeStatus.RECEIVED]: "Recebida",
  [IncomeStatus.OVERDUE]: "Vencida",
};

@Injectable()
export class IncomeReceiptsExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.INCOME_RECEIPTS;

  constructor(
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    if (!filters.idIncome) {
      throw AppException.from(
        APP_ERRORS.exports.missingIncomeFilter,
        undefined,
      );
    }

    const income = await this.incomeRepository.findById(
      userId,
      filters.idIncome,
    );

    const rows = income.installments.map((installment) => [
      `${installment.installmentNumber}/${income.installmentCount}`,
      formatDateBR(installment.dueDate),
      formatCurrencyBRL(installment.amountDue),
      formatCurrencyBRL(installment.amountReceived),
      formatLocalTimestampBR(installment.receivedAt),
      INCOME_STATUS_LABELS[installment.status],
    ]);

    const totalDue = income.installments.reduce(
      (sum, installment) => sum + installment.amountDue,
      0,
    );
    const totalReceived = income.installments.reduce(
      (sum, installment) => sum + installment.amountReceived,
      0,
    );

    return {
      documentTitle: "Relatório de Recebimentos",
      documentSubtitle: income.title,
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Parcela", weight: 1, align: "center" },
        { label: "Vencimento", weight: 1, align: "center" },
        { label: "Valor devido", weight: 1, align: "right" },
        { label: "Valor recebido", weight: 1, align: "right" },
        { label: "Recebido em", weight: 1, align: "center" },
        { label: "Status", weight: 1, align: "center" },
      ],
      rows,
      totals: income.installments.length
        ? [
            { label: "Total devido", value: formatCurrencyBRL(totalDue) },
            {
              label: "Total recebido",
              value: formatCurrencyBRL(totalReceived),
            },
          ]
        : [],
      emptyStateLabel: "Nenhuma parcela encontrada para esta receita.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
