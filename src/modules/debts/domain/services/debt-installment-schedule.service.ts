import { DebtInstallment } from "@/modules/debts/domain/entities/debt-installment.entity";

export class DebtInstallmentScheduleService {
  static build(input: {
    totalAmount: number;
    installmentCount: number;
    startDate: Date;
  }): DebtInstallment[] {
    const totalInCents = Math.round(input.totalAmount * 100);
    const baseInstallmentInCents = Math.floor(
      totalInCents / input.installmentCount,
    );
    const remainder = totalInCents % input.installmentCount;

    return Array.from({ length: input.installmentCount }, (_, index) => {
      const installmentNumber = index + 1;
      const installmentInCents =
        baseInstallmentInCents + (index < remainder ? 1 : 0);
      // startDate is always UTC-midnight-aligned (see date-only.transformer.ts),
      // so month arithmetic must stay in UTC too — local getters/setters
      // would read/write the wrong calendar day on any server running
      // behind UTC (e.g. America/Sao_Paulo).
      const dueDate = new Date(input.startDate);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + index);

      return DebtInstallment.create({
        installmentNumber,
        amountDue: installmentInCents / 100,
        dueDate,
      });
    });
  }
}
