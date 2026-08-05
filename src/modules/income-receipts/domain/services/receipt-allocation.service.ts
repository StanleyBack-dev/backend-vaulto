import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

export type InstallmentSnapshot = {
  idIncomeInstallment: string;
  installmentNumber: number;
  amountDue: number;
  amountReceived: number;
  status: IncomeStatus;
};

export type AllocationLine = {
  idIncomeInstallment: string;
  installmentNumber: number;
  amountApplied: number;
  resultingAmountReceived: number;
  resultingStatus: IncomeStatus;
  fullyReceivedByThisAllocation: boolean;
};

export type AllocationResult = {
  lines: AllocationLine[];
  remainderUnallocated: number;
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Pure allocation logic for applying a receipt across an income's
 * installments. Mirrors PaymentAllocationService: starts at
 * `startInstallmentId` (or the first installment when omitted) and walks
 * forward, fully receiving the starting installment first, then spilling any
 * remaining amount onto the next open installments in sequence.
 * `remainderUnallocated` is non-zero when the amount exceeds everything owed
 * from the starting point onward (an invalid receipt the caller should
 * reject).
 */
export class ReceiptAllocationService {
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
          (installment) =>
            installment.idIncomeInstallment === startInstallmentId,
        )
      : 0;

    const fromIndex = startIndex < 0 ? 0 : startIndex;

    let remaining = round2(amount);
    const lines: AllocationLine[] = [];

    for (let i = fromIndex; i < ordered.length && remaining > 0; i += 1) {
      const installment = ordered[i];
      const outstanding = round2(
        Math.max(installment.amountDue - installment.amountReceived, 0),
      );

      if (outstanding <= 0) {
        continue;
      }

      const amountApplied = round2(Math.min(outstanding, remaining));
      const resultingAmountReceived = round2(
        installment.amountReceived + amountApplied,
      );
      const fullyReceivedByThisAllocation =
        resultingAmountReceived >= installment.amountDue;
      const wasAlreadyReceived = installment.status === IncomeStatus.RECEIVED;

      lines.push({
        idIncomeInstallment: installment.idIncomeInstallment,
        installmentNumber: installment.installmentNumber,
        amountApplied,
        resultingAmountReceived,
        resultingStatus: fullyReceivedByThisAllocation
          ? IncomeStatus.RECEIVED
          : IncomeStatus.PARTIALLY_RECEIVED,
        fullyReceivedByThisAllocation:
          fullyReceivedByThisAllocation && !wasAlreadyReceived,
      });

      remaining = round2(remaining - amountApplied);
    }

    return {
      lines,
      remainderUnallocated: round2(Math.max(remaining, 0)),
    };
  }
}
