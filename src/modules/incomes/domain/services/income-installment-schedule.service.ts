import { IncomeInstallment } from "@/modules/incomes/domain/entities/income-installment.entity";

export class IncomeInstallmentScheduleService {
  static build(input: {
    totalAmount: number;
    installmentCount: number;
    startDate: Date;
  }): IncomeInstallment[] {
    const totalInCents = Math.round(input.totalAmount * 100);
    const baseInstallmentInCents = Math.floor(
      totalInCents / input.installmentCount,
    );
    const remainder = totalInCents % input.installmentCount;

    const startYear = input.startDate.getUTCFullYear();
    const startMonth = input.startDate.getUTCMonth();
    const startDay = input.startDate.getUTCDate();

    return Array.from({ length: input.installmentCount }, (_, index) => {
      const installmentNumber = index + 1;
      const installmentInCents =
        baseInstallmentInCents + (index < remainder ? 1 : 0);
      // startDate is always UTC-midnight-aligned (see date-only.transformer.ts),
      // so month arithmetic must stay in UTC too — local getters/setters
      // would read/write the wrong calendar day on any server running
      // behind UTC (e.g. America/Sao_Paulo).
      const dueDate = this.addCalendarMonths(
        startYear,
        startMonth,
        startDay,
        index,
      );

      return IncomeInstallment.create({
        installmentNumber,
        amountDue: installmentInCents / 100,
        dueDate,
      });
    });
  }

  private static addCalendarMonths(
    year: number,
    month: number,
    day: number,
    monthsToAdd: number,
  ): Date {
    const targetMonthIndex = year * 12 + month + monthsToAdd;
    const targetYear = Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

    // A day that doesn't exist in the target month (e.g. the 30th/31st when
    // the schedule crosses February) must clamp to that month's last day
    // instead of overflowing into the next one — otherwise that installment
    // silently lands in the following month's cycle, doubling it up and
    // leaving the original month with no installment at all.
    const daysInTargetMonth = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0),
    ).getUTCDate();
    const clampedDay = Math.min(day, daysInTargetMonth);

    return new Date(Date.UTC(targetYear, targetMonth, clampedDay));
  }
}
