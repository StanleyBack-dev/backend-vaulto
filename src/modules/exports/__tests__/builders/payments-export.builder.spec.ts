import { AppException } from "@/common/exceptions/app-exception";
import { formatCurrencyBRL } from "@/utils/pdf";
import type { DebtView } from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { PaymentsExportBuilder } from "../../application/builders/payments-export.builder";

function debtView(overrides: Partial<DebtView> = {}): DebtView {
  return {
    idDebt: "debt-1",
    idUsers: "user-1",
    idCategory: "cat-1",
    title: "Financiamento",
    category: "Casa",
    debtType: DebtType.FIXED,
    totalAmount: 1200,
    startDate: new Date("2026-01-01"),
    hasInstallments: true,
    installmentCount: 2,
    status: DebtStatus.PARTIALLY_PAID,
    installments: [
      {
        idDebtInstallment: "inst-1",
        idDebt: "debt-1",
        installmentNumber: 1,
        amountDue: 600,
        amountPaid: 600,
        dueDate: new Date("2026-02-01"),
        paidAt: new Date("2026-02-01T15:00:00.000Z"),
        status: DebtStatus.PAID,
      },
      {
        idDebtInstallment: "inst-2",
        idDebt: "debt-1",
        installmentNumber: 2,
        amountDue: 600,
        amountPaid: 0,
        dueDate: new Date("2026-03-01"),
        status: DebtStatus.OPEN,
      },
    ],
    payments: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("PaymentsExportBuilder", () => {
  it("rejects when no debt is selected", async () => {
    const debtRepository = { findById: jest.fn() };
    const builder = new PaymentsExportBuilder(debtRepository as never);

    await expect(
      builder.build("user-1", "Stanley", {}),
    ).rejects.toBeInstanceOf(AppException);
    expect(debtRepository.findById).not.toHaveBeenCalled();
  });

  it("builds one row per installment with due/paid totals", async () => {
    const debtRepository = {
      findById: jest.fn().mockResolvedValue(debtView()),
    };
    const builder = new PaymentsExportBuilder(debtRepository as never);

    const payload = await builder.build("user-1", "Stanley", {
      idDebt: "debt-1",
    });

    expect(debtRepository.findById).toHaveBeenCalledWith("user-1", "debt-1");
    expect(payload.documentSubtitle).toBe("Financiamento");
    expect(payload.rows).toEqual([
      [
        "1/2",
        "01/02/2026",
        formatCurrencyBRL(600),
        formatCurrencyBRL(600),
        "01/02/2026",
        "Paga",
      ],
      [
        "2/2",
        "01/03/2026",
        formatCurrencyBRL(600),
        formatCurrencyBRL(0),
        "—",
        "Em aberto",
      ],
    ]);
    expect(payload.totals).toEqual([
      { label: "Total devido", value: formatCurrencyBRL(1200) },
      { label: "Total pago", value: formatCurrencyBRL(600) },
    ]);
  });
});
