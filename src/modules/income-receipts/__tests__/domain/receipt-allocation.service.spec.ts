import { ReceiptAllocationService } from "@/modules/income-receipts/domain/services/receipt-allocation.service";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

function installment(
  overrides: Partial<{
    idIncomeInstallment: string;
    installmentNumber: number;
    amountDue: number;
    amountReceived: number;
    status: IncomeStatus;
  }> = {},
) {
  return {
    idIncomeInstallment: "inst-1",
    installmentNumber: 1,
    amountDue: 100,
    amountReceived: 0,
    status: IncomeStatus.PENDING,
    ...overrides,
  };
}

describe("ReceiptAllocationService", () => {
  it("fully receives a single installment with an exact amount", () => {
    const result = ReceiptAllocationService.allocate([installment()], 100);

    expect(result.remainderUnallocated).toBe(0);
    expect(result.lines).toEqual([
      expect.objectContaining({
        idIncomeInstallment: "inst-1",
        amountApplied: 100,
        resultingAmountReceived: 100,
        resultingStatus: IncomeStatus.RECEIVED,
        fullyReceivedByThisAllocation: true,
      }),
    ]);
  });

  it("marks the installment partially received when the amount is less than owed, without touching later installments", () => {
    const installments = [
      installment({ idIncomeInstallment: "inst-1", installmentNumber: 1 }),
      installment({ idIncomeInstallment: "inst-2", installmentNumber: 2 }),
    ];

    const result = ReceiptAllocationService.allocate(installments, 40);

    expect(result.remainderUnallocated).toBe(0);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toEqual(
      expect.objectContaining({
        idIncomeInstallment: "inst-1",
        amountApplied: 40,
        resultingAmountReceived: 40,
        resultingStatus: IncomeStatus.PARTIALLY_RECEIVED,
        fullyReceivedByThisAllocation: false,
      }),
    );
  });

  it("spills overpayment forward onto the next open installment", () => {
    const installments = [
      installment({
        idIncomeInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
      }),
      installment({
        idIncomeInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
    ];

    const result = ReceiptAllocationService.allocate(installments, 150);

    expect(result.remainderUnallocated).toBe(0);
    expect(result.lines).toEqual([
      expect.objectContaining({
        idIncomeInstallment: "inst-1",
        amountApplied: 100,
        resultingStatus: IncomeStatus.RECEIVED,
      }),
      expect.objectContaining({
        idIncomeInstallment: "inst-2",
        amountApplied: 50,
        resultingAmountReceived: 50,
        resultingStatus: IncomeStatus.PARTIALLY_RECEIVED,
      }),
    ]);
  });

  it("cascades overpayment across several subsequent installments", () => {
    const installments = [
      installment({
        idIncomeInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 50,
      }),
      installment({
        idIncomeInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 50,
      }),
      installment({
        idIncomeInstallment: "inst-3",
        installmentNumber: 3,
        amountDue: 50,
      }),
    ];

    const result = ReceiptAllocationService.allocate(installments, 120);

    expect(result.remainderUnallocated).toBe(0);
    expect(
      result.lines.map((line) => [
        line.idIncomeInstallment,
        line.amountApplied,
      ]),
    ).toEqual([
      ["inst-1", 50],
      ["inst-2", 50],
      ["inst-3", 20],
    ]);
    expect(result.lines[2].resultingStatus).toBe(
      IncomeStatus.PARTIALLY_RECEIVED,
    );
  });

  it("tops off an already-partially-received installment before spilling forward", () => {
    const installments = [
      installment({
        idIncomeInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
        amountReceived: 60,
        status: IncomeStatus.PARTIALLY_RECEIVED,
      }),
      installment({
        idIncomeInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
    ];

    const result = ReceiptAllocationService.allocate(installments, 50);

    expect(result.lines).toEqual([
      expect.objectContaining({
        idIncomeInstallment: "inst-1",
        amountApplied: 40,
        resultingAmountReceived: 100,
        resultingStatus: IncomeStatus.RECEIVED,
      }),
      expect.objectContaining({
        idIncomeInstallment: "inst-2",
        amountApplied: 10,
        resultingStatus: IncomeStatus.PARTIALLY_RECEIVED,
      }),
    ]);
  });

  it("reports the unallocated remainder when the receipt exceeds everything owed", () => {
    const installments = [installment({ amountDue: 100 })];

    const result = ReceiptAllocationService.allocate(installments, 150);

    expect(result.remainderUnallocated).toBe(50);
    expect(result.lines[0].amountApplied).toBe(100);
  });

  it("starts allocation at the chosen installment instead of the oldest one", () => {
    const installments = [
      installment({
        idIncomeInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
      }),
      installment({
        idIncomeInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
      installment({
        idIncomeInstallment: "inst-3",
        installmentNumber: 3,
        amountDue: 100,
      }),
    ];

    const result = ReceiptAllocationService.allocate(
      installments,
      120,
      "inst-2",
    );

    expect(result.lines.map((line) => line.idIncomeInstallment)).toEqual([
      "inst-2",
      "inst-3",
    ]);
    expect(result.lines[0].amountApplied).toBe(100);
    expect(result.lines[1].amountApplied).toBe(20);
  });

  it("skips installments already fully received when walking forward", () => {
    const installments = [
      installment({
        idIncomeInstallment: "inst-1",
        installmentNumber: 1,
        amountDue: 100,
        amountReceived: 100,
        status: IncomeStatus.RECEIVED,
      }),
      installment({
        idIncomeInstallment: "inst-2",
        installmentNumber: 2,
        amountDue: 100,
      }),
    ];

    const result = ReceiptAllocationService.allocate(installments, 30);

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].idIncomeInstallment).toBe("inst-2");
  });
});
