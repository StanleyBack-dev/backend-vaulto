import { CreditCardDueDateService } from "@/modules/credit-cards/domain/services/credit-card-due-date.service";

describe("CreditCardDueDateService", () => {
  it("should keep the invoice in the current cycle's month when dueDay is after closingDay and the purchase is on/before the closing day", () => {
    const dueDate = CreditCardDueDateService.computeNextDueDate(
      15,
      5,
      new Date("2026-07-03T00:00:00.000Z"),
    );

    expect(dueDate).toEqual(new Date("2026-07-15T00:00:00.000Z"));
  });

  it("should roll the purchase into the next cycle when made after the closing day", () => {
    const dueDate = CreditCardDueDateService.computeNextDueDate(
      15,
      5,
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(dueDate).toEqual(new Date("2026-08-15T00:00:00.000Z"));
  });

  it("should push the invoice to the following month when dueDay comes on/before closingDay", () => {
    const dueDate = CreditCardDueDateService.computeNextDueDate(
      10,
      28,
      new Date("2026-07-15T00:00:00.000Z"),
    );

    expect(dueDate).toEqual(new Date("2026-08-10T00:00:00.000Z"));
  });

  it("should roll both the cycle and the due month when purchased after closing with dueDay<=closingDay", () => {
    const dueDate = CreditCardDueDateService.computeNextDueDate(
      10,
      28,
      new Date("2026-07-29T00:00:00.000Z"),
    );

    expect(dueDate).toEqual(new Date("2026-09-10T00:00:00.000Z"));
  });

  it("should clamp the closing day to the shorter month when deciding which cycle a purchase belongs to", () => {
    // February 2026 has 28 days, so closingDay 31 clamps to 28 — a purchase
    // on the 20th is still on/before that clamped closing day.
    const dueDate = CreditCardDueDateService.computeNextDueDate(
      10,
      31,
      new Date("2026-02-20T00:00:00.000Z"),
    );

    expect(dueDate).toEqual(new Date("2026-03-10T00:00:00.000Z"));
  });

  it("should clamp the resulting due day to the last valid day of the due month", () => {
    // dueDay 31 in a cycle whose invoice lands in February must clamp to 28.
    const dueDate = CreditCardDueDateService.computeNextDueDate(
      31,
      5,
      new Date("2026-02-03T00:00:00.000Z"),
    );

    expect(dueDate).toEqual(new Date("2026-02-28T00:00:00.000Z"));
  });
});
