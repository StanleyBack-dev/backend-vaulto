import { Inject, Injectable } from "@nestjs/common";
import { formatCurrencyBRL, formatDateBR } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  FINANCIAL_GOAL_REPOSITORY,
  type FinancialGoalRepositoryPort,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { computeGoalProgress } from "@/modules/goals/domain/services/goal-progress.service";
import { FinancialGoalStatus } from "@/modules/goals/domain/enums/financial-goal-status.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { EXPORT_MAX_ROWS } from "../../domain/constants/export.constant";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const GOAL_STATUS_LABELS: Record<FinancialGoalStatus, string> = {
  [FinancialGoalStatus.IN_PROGRESS]: "Em andamento",
  [FinancialGoalStatus.COMPLETED]: "Concluída",
};

@Injectable()
export class GoalsExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.GOALS;

  constructor(
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
  ): Promise<TabularReportPayload> {
    const { records } = await this.goalRepository.listByUser(userId, {
      limit: EXPORT_MAX_ROWS,
    });

    const rows = records.map((goal) => {
      const progress = computeGoalProgress({
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        createdAt: goal.createdAt,
      });

      return [
        goal.title,
        formatCurrencyBRL(goal.targetAmount),
        formatCurrencyBRL(goal.currentAmount),
        `${progress.progressPercent}%`,
        goal.targetDate ? formatDateBR(goal.targetDate) : "—",
        GOAL_STATUS_LABELS[progress.status],
      ];
    });

    const totalTarget = records.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = records.reduce(
      (sum, goal) => sum + goal.currentAmount,
      0,
    );

    return {
      documentTitle: "Relatório de Metas Financeiras",
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Título", weight: 3 },
        { label: "Valor alvo", weight: 1, align: "right" },
        { label: "Valor atual", weight: 1, align: "right" },
        { label: "Progresso", weight: 1, align: "center" },
        { label: "Prazo", weight: 1, align: "center" },
        { label: "Status", weight: 1, align: "center" },
      ],
      rows,
      totals: records.length
        ? [
            { label: "Valor alvo total", value: formatCurrencyBRL(totalTarget) },
            {
              label: "Valor guardado total",
              value: formatCurrencyBRL(totalCurrent),
            },
          ]
        : [],
      emptyStateLabel: "Nenhuma meta financeira cadastrada.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
