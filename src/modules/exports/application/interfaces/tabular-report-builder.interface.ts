import type { TabularReportPayload } from "@/common/interfaces/tabular-report-payload.interface";
import type { ExportResource } from "../../domain/enums/export-resource.enum";
import type { ExportResourceFilters } from "./export-resource-filters.interface";

export interface TabularReportBuilder {
  readonly resource: ExportResource;
  build(
    userId: string,
    userLabel: string,
    filters: ExportResourceFilters,
  ): Promise<TabularReportPayload>;
}
