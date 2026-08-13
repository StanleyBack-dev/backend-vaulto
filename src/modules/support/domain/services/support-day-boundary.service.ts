const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const saoPauloDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Brazil has had no DST since 2019, so the -03:00 offset is fixed
 * year-round — safe to bake in directly instead of pulling in a timezone
 * library for one calculation.
 */
export class SupportDayBoundaryService {
  static startOfTodayInSaoPaulo(now: Date): Date {
    const parts = saoPauloDatePartsFormatter
      .formatToParts(now)
      .reduce<Record<string, string>>((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});

    return new Date(
      Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        3,
        0,
        0,
      ),
    );
  }

  static startOfTomorrowInSaoPaulo(now: Date): Date {
    return new Date(this.startOfTodayInSaoPaulo(now).getTime() + ONE_DAY_MS);
  }
}
