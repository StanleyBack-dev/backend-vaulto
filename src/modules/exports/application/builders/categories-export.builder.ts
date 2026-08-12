import { Inject, Injectable } from "@nestjs/common";
import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from "@/modules/categories/application/ports/category-repository.port";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { ExportResource } from "../../domain/enums/export-resource.enum";
import { EXPORT_MAX_ROWS } from "../../domain/constants/export.constant";
import {
  buildGeneratedAtLabel,
  buildReferenceCode,
} from "../utils/export-metadata.util";
import type { ExportResourceFilters } from "../interfaces/export-resource-filters.interface";
import type { TabularReportBuilder } from "../interfaces/tabular-report-builder.interface";

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.EXPENSE]: "Despesa",
  [CategoryType.INCOME]: "Receita",
};

@Injectable()
export class CategoriesExportBuilder implements TabularReportBuilder {
  readonly resource = ExportResource.CATEGORIES;

  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload> {
    const { records } = await this.categoryRepository.listByUser(userId, {
      limit: EXPORT_MAX_ROWS,
      status: filters.activeOnly,
      type: filters.categoryType,
    });

    const rows = records.map((category) => [
      category.name,
      CATEGORY_TYPE_LABELS[category.type],
      category.status ? "Ativa" : "Inativa",
    ]);

    return {
      documentTitle: "Relatório de Categorias",
      generatedAtLabel: buildGeneratedAtLabel(),
      userLabel,
      columns: [
        { label: "Nome", weight: 3 },
        { label: "Tipo", weight: 1, align: "center" },
        { label: "Status", weight: 1, align: "center" },
      ],
      rows,
      totals: [],
      emptyStateLabel: "Nenhuma categoria cadastrada.",
      referenceCode: buildReferenceCode(this.resource),
    };
  }
}
