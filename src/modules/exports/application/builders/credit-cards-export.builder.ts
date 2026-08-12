import { Inject, Injectable } from "@nestjs/common";
import { formatCurrencyBRL } from "@/utils/pdf";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  CREDIT_CARD_REPOSITORY,
  type CreditCardRepositoryPort,
} from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { EXPORT_MAX_ROWS } from "../../domain/constants/export.constant";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

@Injectable()
export class CreditCardsExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.CREDIT_CARDS;

  constructor(
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: CreditCardRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    const { records } = await this.creditCardRepository.listByUser(userId, {
      limit: EXPORT_MAX_ROWS,
      status: filters.activeOnly,
    });

    const rows = records.map((card) => [
      card.name,
      formatCurrencyBRL(card.creditLimit),
      formatCurrencyBRL(card.usedLimit),
      formatCurrencyBRL(card.availableLimit),
      String(card.closingDay),
      String(card.dueDay),
      card.status ? "Ativo" : "Inativo",
    ]);

    const totalLimit = records.reduce((sum, card) => sum + card.creditLimit, 0);
    const totalUsed = records.reduce((sum, card) => sum + card.usedLimit, 0);

    return {
      documentTitle: "Relatório de Cartões de Crédito",
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Nome", weight: 2 },
        { label: "Limite", weight: 1, align: "right" },
        { label: "Limite usado", weight: 1, align: "right" },
        { label: "Limite disponível", weight: 1, align: "right" },
        { label: "Fecha dia", weight: 1, align: "center" },
        { label: "Vence dia", weight: 1, align: "center" },
        { label: "Status", weight: 1, align: "center" },
      ],
      rows,
      totals: records.length
        ? [
            { label: "Limite total", value: formatCurrencyBRL(totalLimit) },
            { label: "Limite usado total", value: formatCurrencyBRL(totalUsed) },
          ]
        : [],
      emptyStateLabel: "Nenhum cartão de crédito cadastrado.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
