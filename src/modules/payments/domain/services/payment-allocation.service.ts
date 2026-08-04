import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

export type InstallmentSnapshot = {
  idDebtInstallment: string;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  status: DebtStatus;
};

export type AllocationLine = {
  idDebtInstallment: string;
  installmentNumber: number;
  amountApplied: number;
  resultingAmountPaid: number;
  resultingStatus: DebtStatus;
  fullyPaidByThisAllocation: boolean;
};

export type AllocationResult = {
  lines: AllocationLine[];
  remainderUnallocated: number;
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Pure allocation logic for applying a payment across a debt's installments.
 *
 * Starts at `startInstallmentId` (or the first installment when omitted) and
 * walks forward through subsequent installment numbers: fully pays the
 * starting installment first, then spills any remaining amount onto the
 * next open installments in sequence. A payment smaller than what's owed on
 * the starting installment is applied there only (status stays open/partial)
 * — shortfalls never affect later installments, only overpayment spills
 * forward. `remainderUnallocated` is non-zero when the amount exceeds
 * everything owed from the starting point onward (an invalid payment the
 * caller should reject).
 */
export class PaymentAllocationService {
  static allocate(
    installments: InstallmentSnapshot[],
    amount: number,
    startInstallmentId?: string,
  ): AllocationResult {
    const ordered = [...installments].sort(
      (a, b) => a.installmentNumber - b.installmentNumber,
    );

    const startIndex = startInstallmentId
      ? ordered.findIndex(
          (installment) => installment.idDebtInstallment === startInstallmentId,
        )
      : 0;

    const fromIndex = startIndex < 0 ? 0 : startIndex;

    let remaining = round2(amount);
    const lines: AllocationLine[] = [];

    for (let i = fromIndex; i < ordered.length && remaining > 0; i += 1) {
      const installment = ordered[i];
      const outstanding = round2(
        Math.max(installment.amountDue - installment.amountPaid, 0),
      );

      if (outstanding <= 0) {
        continue;
      }

      const amountApplied = round2(Math.min(outstanding, remaining));
      const resultingAmountPaid = round2(
        installment.amountPaid + amountApplied,
      );
      const fullyPaidByThisAllocation =
        resultingAmountPaid >= installment.amountDue;
      const wasAlreadyPaid = installment.status === DebtStatus.PAID;

      lines.push({
        idDebtInstallment: installment.idDebtInstallment,
        installmentNumber: installment.installmentNumber,
        amountApplied,
        resultingAmountPaid,
        resultingStatus: fullyPaidByThisAllocation
          ? DebtStatus.PAID
          : DebtStatus.PARTIALLY_PAID,
        fullyPaidByThisAllocation: fullyPaidByThisAllocation && !wasAlreadyPaid,
      });

      remaining = round2(remaining - amountApplied);
    }

    return {
      lines,
      remainderUnallocated: round2(Math.max(remaining, 0)),
    };
  }
}
