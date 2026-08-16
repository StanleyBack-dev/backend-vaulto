import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { formatCurrencyBRL, formatDateBR } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
} from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import { formatLocalTimestampBR } from "../utils/format-local-timestamp.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  [DebtStatus.OPEN]: "Em aberto",
  [DebtStatus.PARTIALLY_PAID]: "Parcialmente paga",
  [DebtStatus.PAID]: "Paga",
  [DebtStatus.OVERDUE]: "Vencida",
};

@Injectable()
export class PaymentsExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.PAYMENTS;

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    if (!filters.idDebt) {
      throw AppException.from(APP_ERRORS.exports.missingDebtFilter, undefined);
    }

    const debt = await this.debtRepository.findById(userId, filters.idDebt);

    const rows = debt.installments.map((installment) => [
      `${installment.installmentNumber}/${debt.installmentCount}`,
      formatDateBR(installment.dueDate),
      formatCurrencyBRL(installment.amountDue),
      formatCurrencyBRL(installment.amountPaid),
      formatLocalTimestampBR(installment.paidAt),
      DEBT_STATUS_LABELS[installment.status],
    ]);

    const totalDue = debt.installments.reduce(
      (sum, installment) => sum + installment.amountDue,
      0,
    );
    const totalPaid = debt.installments.reduce(
      (sum, installment) => sum + installment.amountPaid,
      0,
    );

    return {
      documentTitle: "Relatório de Pagamentos",
      documentSubtitle: debt.title,
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Parcela", weight: 1, align: "center" },
        { label: "Vencimento", weight: 1, align: "center" },
        { label: "Valor devido", weight: 1, align: "right" },
        { label: "Valor pago", weight: 1, align: "right" },
        { label: "Pago em", weight: 1, align: "center" },
        { label: "Status", weight: 1, align: "center" },
      ],
      rows,
      totals: debt.installments.length
        ? [
            { label: "Total devido", value: formatCurrencyBRL(totalDue) },
            { label: "Total pago", value: formatCurrencyBRL(totalPaid) },
          ]
        : [],
      emptyStateLabel: "Nenhuma parcela encontrada para esta dívida.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
