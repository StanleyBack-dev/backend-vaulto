import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { formatCurrencyBRL, formatDateBR } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  FINANCIAL_GOAL_REPOSITORY,
  type FinancialGoalRepositoryPort,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

@Injectable()
export class GoalContributionsExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.GOAL_CONTRIBUTIONS;

  constructor(
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    if (!filters.idFinancialGoal) {
      throw AppException.from(APP_ERRORS.exports.missingGoalFilter, undefined);
    }

    const goal = await this.goalRepository.findById(
      userId,
      filters.idFinancialGoal,
    );

    const contributions = [...goal.contributions].sort(
      (a, b) => a.contributedAt.getTime() - b.contributedAt.getTime(),
    );

    const rows = contributions.map((contribution) => [
      formatDateBR(contribution.contributedAt),
      formatCurrencyBRL(contribution.amount),
      contribution.note ?? "—",
    ]);

    const total = contributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0,
    );

    return {
      documentTitle: "Relatório de Contribuições",
      documentSubtitle: goal.title,
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Data", weight: 1, align: "center" },
        { label: "Valor", weight: 1, align: "right" },
        { label: "Observação", weight: 3 },
      ],
      rows,
      totals: contributions.length
        ? [{ label: "Total contribuído", value: formatCurrencyBRL(total) }]
        : [],
      emptyStateLabel: "Nenhuma contribuição registrada para esta meta.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
