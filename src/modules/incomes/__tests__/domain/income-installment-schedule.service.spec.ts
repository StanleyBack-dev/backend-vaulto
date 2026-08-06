import { IncomeInstallmentScheduleService } from "@/modules/incomes/domain/services/income-installment-schedule.service";

describe("IncomeInstallmentScheduleService", () => {
  it("should build one installment per month starting from startDate", () => {
    const installments = IncomeInstallmentScheduleService.build({
      totalAmount: 300,
      installmentCount: 3,
      startDate: new Date("2026-04-10T00:00:00.000Z"),
    });

    expect(
      installments.map((installment) => installment.toPrimitive().dueDate),
    ).toEqual([
      new Date("2026-04-10T00:00:00.000Z"),
      new Date("2026-05-10T00:00:00.000Z"),
      new Date("2026-06-10T00:00:00.000Z"),
    ]);
  });

  it("should clamp a day that does not exist in February instead of overflowing into March", () => {
    const installments = IncomeInstallmentScheduleService.build({
      totalAmount: 300,
      installmentCount: 3,
      startDate: new Date("2026-01-31T00:00:00.000Z"),
    });

    expect(
      installments.map((installment) => installment.toPrimitive().dueDate),
    ).toEqual([
      new Date("2026-01-31T00:00:00.000Z"),
      new Date("2026-02-28T00:00:00.000Z"),
      new Date("2026-03-31T00:00:00.000Z"),
    ]);
  });

  it("should clamp to February 29th on a leap year", () => {
    const installments = IncomeInstallmentScheduleService.build({
      totalAmount: 200,
      installmentCount: 2,
      startDate: new Date("2028-01-31T00:00:00.000Z"),
    });

    expect(
      installments.map((installment) => installment.toPrimitive().dueDate),
    ).toEqual([
      new Date("2028-01-31T00:00:00.000Z"),
      new Date("2028-02-29T00:00:00.000Z"),
    ]);
  });

  it("should distribute the remainder cents across the first installments", () => {
    const installments = IncomeInstallmentScheduleService.build({
      totalAmount: 100,
      installmentCount: 3,
      startDate: new Date("2026-04-10T00:00:00.000Z"),
    });

    expect(
      installments.map((installment) => installment.toPrimitive().amountDue),
    ).toEqual([33.34, 33.33, 33.33]);
  });

  it("should default a non-installment income (count 1) to a single installment for the full amount", () => {
    const installments = IncomeInstallmentScheduleService.build({
      totalAmount: 1000,
      installmentCount: 1,
      startDate: new Date("2026-08-05T00:00:00.000Z"),
    });

    expect(installments).toHaveLength(1);
    expect(installments[0].toPrimitive()).toMatchObject({
      installmentNumber: 1,
      amountDue: 1000,
      dueDate: new Date("2026-08-05T00:00:00.000Z"),
    });
  });
});
