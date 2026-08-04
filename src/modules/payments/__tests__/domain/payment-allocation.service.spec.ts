import { PaymentAllocationService } from "@/modules/payments/domain/services/payment-allocation.service";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

function installment(
  overrides: Partial<{
    idDebtInstallment: string;
    installmentNumber: number;
    amountDue: number;
    amountPaid: number;
    status: DebtStatus;
  }> = {},
) {
  return {
    idDebtInstallment: "inst-1",
    installmentNumber: 1,
    amountDue: 100,
    amountPaid: 0,
    status: DebtStatus.OPEN,
    ...overrides,
  };
}

describe("PaymentAllocationService", () => {
  it("fully pays a single installment with an exact amount", () => {
    const result = PaymentAllocationService.allocate([installment()], 100);

    expect(result.remainderUnallocated).toBe(0);
    expect(result.lines).toEqual([
      expect.objectContaining({
        idDebtInstallment: "inst-1",
        amountApplied: 100,
        resultingAmountPaid: 100,
        resultingStatus: DebtStatus.PAID,
        fullyPaidByThisAllocation: true,
      }),
    ]);
  });

  it("marks the installment partially paid when the amount is less than owed, without touching later installments", () => {
    const installments = [
      installment({ idDebtInstallment: "inst-1", installmentNumber: 1 }),
      installment({ idDebtInstallment: "inst-2", installmentNumber: 2 }),
    ];

    const result = PaymentAllocationService.allocate(installments, 40);

    expect(result.remainderUnallocated).toBe(0);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toEqual(
      expect.objectContaining({
        idDebtInstallment: "inst-1",
        amountApplied: 40,
        resultingAmountPaid: 40,
        resultingStatus: DebtStatus.PARTIALLY_PAID,
        fullyPaidByThisAllocation: false,
      }),
    );
  });

  it("spills overpayment forward onto the next open installment", () => {
    const installments = [
      installment({
        idDebtInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
      }),
      installment({
        idDebtInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
    ];

    const result = PaymentAllocationService.allocate(installments, 150);

    expect(result.remainderUnallocated).toBe(0);
    expect(result.lines).toEqual([
      expect.objectContaining({
        idDebtInstallment: "inst-1",
        amountApplied: 100,
        resultingStatus: DebtStatus.PAID,
      }),
      expect.objectContaining({
        idDebtInstallment: "inst-2",
        amountApplied: 50,
        resultingAmountPaid: 50,
        resultingStatus: DebtStatus.PARTIALLY_PAID,
      }),
    ]);
  });

  it("cascades overpayment across several subsequent installments", () => {
    const installments = [
      installment({
        idDebtInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 50,
      }),
      installment({
        idDebtInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 50,
      }),
      installment({
        idDebtInstallment: "inst-3",
        installmentNumber: 3,
        amountDue: 50,
      }),
    ];

    const result = PaymentAllocationService.allocate(installments, 120);

    expect(result.remainderUnallocated).toBe(0);
    expect(
      result.lines.map((line) => [line.idDebtInstallment, line.amountApplied]),
    ).toEqual([
      ["inst-1", 50],
      ["inst-2", 50],
      ["inst-3", 20],
    ]);
    expect(result.lines[2].resultingStatus).toBe(DebtStatus.PARTIALLY_PAID);
  });

  it("tops off an already-partially-paid installment before spilling forward", () => {
    const installments = [
      installment({
        idDebtInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
        amountPaid: 60,
        status: DebtStatus.PARTIALLY_PAID,
      }),
      installment({
        idDebtInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
    ];

    const result = PaymentAllocationService.allocate(installments, 50);

    expect(result.lines).toEqual([
      expect.objectContaining({
        idDebtInstallment: "inst-1",
        amountApplied: 40,
        resultingAmountPaid: 100,
        resultingStatus: DebtStatus.PAID,
      }),
      expect.objectContaining({
        idDebtInstallment: "inst-2",
        amountApplied: 10,
        resultingStatus: DebtStatus.PARTIALLY_PAID,
      }),
    ]);
  });

  it("reports the unallocated remainder when the payment exceeds everything owed", () => {
    const installments = [installment({ amountDue: 100 })];

    const result = PaymentAllocationService.allocate(installments, 150);

    expect(result.remainderUnallocated).toBe(50);
    expect(result.lines[0].amountApplied).toBe(100);
  });

  it("starts allocation at the chosen installment instead of the oldest one", () => {
    const installments = [
      installment({
        idDebtInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
      }),
      installment({
        idDebtInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
      installment({
        idDebtInstallment: "inst-3",
        installmentNumber: 3,
        amountDue: 100,
      }),
    ];

    const result = PaymentAllocationService.allocate(
      installments,
      120,
      "inst-2",
    );

    expect(result.lines.map((line) => line.idDebtInstallment)).toEqual([
      "inst-2",
      "inst-3",
    ]);
    expect(result.lines[0].amountApplied).toBe(100);
    expect(result.lines[1].amountApplied).toBe(20);
  });

  it("skips installments already fully paid when walking forward", () => {
    const installments = [
      installment({
        idDebtInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
        amountPaid: 100,
        status: DebtStatus.PAID,
      }),
      installment({
        idDebtInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
    ];

    const result = PaymentAllocationService.allocate(installments, 30);

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].idDebtInstallment).toBe("inst-2");
  });
});
