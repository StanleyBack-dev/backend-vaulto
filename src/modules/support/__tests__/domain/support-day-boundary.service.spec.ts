import { SupportDayBoundaryService } from "@/modules/support/domain/services/support-day-boundary.service";

describe("SupportDayBoundaryService", () => {
  it("resolves 00:00 America/Sao_Paulo (03:00 UTC) for a given instant", () => {
    // 2026-08-13T14:30:00-03:00 == 2026-08-13T17:30:00Z
    const now = new Date("2026-08-13T17:30:00.000Z");

    const startOfToday = SupportDayBoundaryService.startOfTodayInSaoPaulo(now);

    expect(startOfToday.toISOString()).toBe("2026-08-13T03:00:00.000Z");
  });

  it("rolls the boundary to the previous UTC day when it is still yesterday in Sao Paulo", () => {
    // 2026-08-13T01:00:00Z is 2026-08-12T22:00:00-03:00 — still Aug 12 locally.
    const now = new Date("2026-08-13T01:00:00.000Z");

    const startOfToday = SupportDayBoundaryService.startOfTodayInSaoPaulo(now);

    expect(startOfToday.toISOString()).toBe("2026-08-12T03:00:00.000Z");
  });

  it("returns exactly one day after the start of today", () => {
    const now = new Date("2026-08-13T17:30:00.000Z");

    const startOfToday = SupportDayBoundaryService.startOfTodayInSaoPaulo(now);
    const startOfTomorrow =
      SupportDayBoundaryService.startOfTomorrowInSaoPaulo(now);

    expect(startOfTomorrow.getTime() - startOfToday.getTime()).toBe(
      24 * 60 * 60 * 1000,
    );
  });
});
