import { DebtInstallmentScheduleService } from "@/modules/debts/domain/services/debt-installment-schedule.service";

describe("DebtInstallmentScheduleService", () => {
  it("should build one installment per month starting from startDate", () => {
    const installments = DebtInstallmentScheduleService.build({
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
    const installments = DebtInstallmentScheduleService.build({
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
    const installments = DebtInstallmentScheduleService.build({
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
});
