import { toLocalNaiveIsoString } from "@/common/utils/date.util";
import { formatDateBR } from "@/utils/pdf";

/**
 * Formats a real instant (timestamptz column, e.g. paidAt/receivedAt) as
 * DD/MM/YYYY using the Brazil wall-clock calendar day — distinct from
 * `formatDateBR`, which assumes a UTC-midnight-aligned date-only value.
 */
export function formatLocalTimestampBR(date?: Date): string {
  if (!date) {
    return "—";
  }

  const iso = toLocalNaiveIsoString(date);
  return iso ? formatDateBR(iso.slice(0, 10)) : "—";
}
