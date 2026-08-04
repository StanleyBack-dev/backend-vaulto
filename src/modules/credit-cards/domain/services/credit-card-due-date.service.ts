/**
 * Pure calculation of a credit card's next billing due date, mirroring how
 * real card statements work: a purchase belongs to the cycle that closes on
 * the card's closing day, and that cycle's invoice is due on the due day —
 * which may land in the same month as the closing (closingDay < dueDay) or
 * roll into the following month (dueDay <= closingDay, e.g. closes on the
 * 28th, due on the 10th of the next month). Kept UTC-only throughout (see
 * date-only.transformer.ts) since these are calendar days with no timezone
 * dimension.
 */
export class CreditCardDueDateService {
  static computeNextDueDate(
    dueDay: number,
    closingDay: number,
    referenceDate: Date = new Date(),
  ): Date {
    const refYear = referenceDate.getUTCFullYear();
    const refMonth = referenceDate.getUTCMonth();
    const refDay = referenceDate.getUTCDate();
    const referenceMonthIndex = refYear * 12 + refMonth;

    const clampedClosingDayThisMonth = this.clampDayToMonth(
      refYear,
      refMonth,
      closingDay,
    );

    // A purchase made on/before this month's closing day belongs to this
    // month's cycle; after it, the purchase rolls into next month's cycle.
    const cycleMonthIndex =
      refDay <= clampedClosingDayThisMonth
        ? referenceMonthIndex
        : referenceMonthIndex + 1;

    // The invoice for a cycle is due in the same month as its closing when
    // the due day comes after the closing day; otherwise it is due the
    // following month.
    const dueMonthIndex =
      dueDay > closingDay ? cycleMonthIndex : cycleMonthIndex + 1;

    return this.buildDueDateForMonthIndex(dueMonthIndex, dueDay);
  }

  private static clampDayToMonth(
    year: number,
    month: number,
    day: number,
  ): number {
    // Clamp to the last valid day of the target month (e.g. day 31 falls
    // back to the 28th/29th/30th in shorter months), since a statement
    // always lands on a real calendar day.
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Math.min(day, daysInMonth);
  }

  private static buildDueDateForMonthIndex(
    monthIndex: number,
    day: number,
  ): Date {
    const year = Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    const clampedDay = this.clampDayToMonth(year, month, day);

    return new Date(Date.UTC(year, month, clampedDay));
  }
}
