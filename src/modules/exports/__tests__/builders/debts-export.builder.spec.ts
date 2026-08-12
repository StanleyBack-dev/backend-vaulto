import { formatCurrencyBRL } from "@/utils/pdf";
import type { DebtView } from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { DebtsExportBuilder } from "../../application/builders/debts-export.builder";

function debtView(overrides: Partial<DebtView> = {}): DebtView {
  return {
    idDebt: "debt-1",
    idUsers: "user-1",
    idCategory: "cat-1",
    title: "Cartão Nubank",
    category: "Cartão de crédito",
    debtType: DebtType.FIXED,
    totalAmount: 500,
    startDate: new Date("2026-01-01"),
    dueDate: new Date("2026-08-10"),
    hasInstallments: false,
    installmentCount: 1,
    status: DebtStatus.OPEN,
    installments: [],
    payments: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("DebtsExportBuilder", () => {
  it("builds rows and totals from the user's debts", async () => {
    const debtRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [
          debtView({ totalAmount: 100 }),
          debtView({ idDebt: "debt-2", totalAmount: 250, creditCard: "Nubank" }),
        ],
        total: 2,
      }),
    };
    const builder = new DebtsExportBuilder(debtRepository as never);

    const payload = await builder.build("user-1", "Stanley", {});

    expect(debtRepository.listByUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ dueDateFrom: undefined, dueDateTo: undefined }),
    );
    expect(payload.rows).toHaveLength(2);
    expect(payload.rows[1][2]).toBe("Nubank");
    expect(payload.totals).toEqual([
      { label: "Total", value: formatCurrencyBRL(350) },
    ]);
  });

  it("returns no totals when there are no debts", async () => {
    const debtRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    };
    const builder = new DebtsExportBuilder(debtRepository as never);

    const payload = await builder.build("user-1", "Stanley", {});

    expect(payload.rows).toHaveLength(0);
    expect(payload.totals).toEqual([]);
  });

  it("forwards the status/type/category filters applied on screen", async () => {
    const debtRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    };
    const builder = new DebtsExportBuilder(debtRepository as never);

    await builder.build("user-1", "Stanley", {
      debtStatus: DebtStatus.OVERDUE,
      debtType: DebtType.VARIABLE,
      idCategory: "cat-9",
    });

    expect(debtRepository.listByUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        status: DebtStatus.OVERDUE,
        debtType: DebtType.VARIABLE,
        idCategory: "cat-9",
      }),
    );
  });
});
