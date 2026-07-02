import { DebtInstallment } from "@/modules/debts/domain/entities/debt-installment.entity";

export class DebtInstallmentScheduleService {
  static build(input: {
    totalAmount: number;
    installmentCount: number;
    startDate: Date;
  }): DebtInstallment[] {
    const totalInCents = Math.round(input.totalAmount * 100);
    const baseInstallmentInCents = Math.floor(totalInCents / input.installmentCount);
    const remainder = totalInCents % input.installmentCount;

    return Array.from({ length: input.installmentCount }, (_, index) => {
      const installmentNumber = index + 1;
      const installmentInCents =
        baseInstallmentInCents + (index < remainder ? 1 : 0);
      const dueDate = new Date(input.startDate);
      dueDate.setMonth(dueDate.getMonth() + index);

      return DebtInstallment.create({
        installmentNumber,
        amountDue: installmentInCents / 100,
        dueDate,
      });
    });
  }
}
