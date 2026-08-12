import { formatLongDateBR } from "@/utils/pdf";
import type { ExportResource } from "../../domain/enums/export-resource.enum";

export function buildGeneratedAtLabel(now: Date = new Date()): string {
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return `Gerado em ${formatLongDateBR(now)} às ${time}`;
}

export function buildReferenceCode(
  resource: ExportResource,
  now: Date = new Date(),
): string {
  return `EXP-${resource}-${now.getTime().toString(36).toUpperCase()}`;
}
