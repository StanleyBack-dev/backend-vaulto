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
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
} from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { StatementScope } from "../../domain/enums/statement-scope.enum";
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

const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  [IncomeStatus.PENDING]: "Pendente",
  [IncomeStatus.PARTIALLY_RECEIVED]: "Parcialmente recebida",
  [IncomeStatus.RECEIVED]: "Recebida",
  [IncomeStatus.OVERDUE]: "Vencida",
};

interface StatementLine {
  kind: "Dívida" | "Receita";
  title: string;
  category: string;
  installmentLabel: string;
  dueDate: Date;
  amountExpected: number;
  amountRealized: number;
  statusLabel: string;
}

@Injectable()
export class StatementExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.STATEMENT;

  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    if (!filters.dueDateFrom || !filters.dueDateTo) {
      throw AppException.from(
        APP_ERRORS.exports.missingPeriodFilter,
        undefined,
      );
    }

    const scope = filters.statementScope ?? StatementScope.BOTH;
    const lines: StatementLine[] = [];

    if (scope === StatementScope.DEBTS || scope === StatementScope.BOTH) {
      const { records } = await this.debtRepository.listByUser(userId, {
        limit: EXPORT_MAX_ROWS,
        dueDateFrom: filters.dueDateFrom,
        dueDateTo: filters.dueDateTo,
      });

      for (const debt of records) {
        for (const installment of debt.installments) {
          if (
            installment.dueDate < filters.dueDateFrom ||
            installment.dueDate > filters.dueDateTo
          ) {
            continue;
          }

          lines.push({
            kind: "Dívida",
            title: debt.title,
            category: debt.category,
            installmentLabel: `${installment.installmentNumber}/${debt.installmentCount}`,
            dueDate: installment.dueDate,
            amountExpected: installment.amountDue,
            amountRealized: installment.amountPaid,
            statusLabel: DEBT_STATUS_LABELS[installment.status],
          });
        }
      }
    }

    if (scope === StatementScope.INCOMES || scope === StatementScope.BOTH) {
      const { records } = await this.incomeRepository.listByUser(userId, {
        limit: EXPORT_MAX_ROWS,
        dueDateFrom: filters.dueDateFrom,
        dueDateTo: filters.dueDateTo,
      });

      for (const income of records) {
        for (const installment of income.installments) {
          if (
            installment.dueDate < filters.dueDateFrom ||
            installment.dueDate > filters.dueDateTo
          ) {
            continue;
          }

          lines.push({
            kind: "Receita",
            title: income.title,
            category: income.category,
            installmentLabel: `${installment.installmentNumber}/${income.installmentCount}`,
            dueDate: installment.dueDate,
            amountExpected: installment.amountDue,
            amountRealized: installment.amountReceived,
            statusLabel: INCOME_STATUS_LABELS[installment.status],
          });
        }
      }
    }

    lines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const rows = lines.map((line) => [
      line.kind,
      line.title,
      line.category,
      line.installmentLabel,
      formatDateBR(line.dueDate),
      formatCurrencyBRL(line.amountExpected),
      formatCurrencyBRL(line.amountRealized),
      line.statusLabel,
    ]);

    const totalExpected = lines.reduce(
      (sum, line) => sum + line.amountExpected,
      0,
    );
    const totalRealized = lines.reduce(
      (sum, line) => sum + line.amountRealized,
      0,
    );

    return {
      documentTitle: "Extrato Financeiro",
      documentSubtitle: `Período: ${formatDateBR(filters.dueDateFrom)} a ${formatDateBR(filters.dueDateTo)}`,
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Tipo", weight: 1, align: "center" },
        { label: "Título", weight: 3 },
        { label: "Categoria", weight: 2 },
        { label: "Parcela", weight: 1, align: "center" },
        { label: "Vencimento", weight: 1, align: "center" },
        { label: "Valor previsto", weight: 1, align: "right" },
        { label: "Valor realizado", weight: 1, align: "right" },
        { label: "Status", weight: 1, align: "center" },
      ],
      rows,
      totals: lines.length
        ? [
            {
              label: "Total previsto",
              value: formatCurrencyBRL(totalExpected),
            },
            {
              label: "Total realizado",
              value: formatCurrencyBRL(totalRealized),
            },
          ]
        : [],
      emptyStateLabel:
        "Nenhum lançamento encontrado para o período selecionado.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
