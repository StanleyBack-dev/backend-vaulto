import { formatCurrencyBRL } from "@/utils/pdf";
import type { IncomeView } from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import { IncomesExportBuilder } from "../../application/builders/incomes-export.builder";

function incomeView(overrides: Partial<IncomeView> = {}): IncomeView {
  return {
    idIncome: "income-1",
    idUsers: "user-1",
    idCategory: "cat-1",
    title: "Salário",
    category: "Trabalho",
    incomeType: IncomeType.FIXED,
    totalAmount: 3000,
    startDate: new Date("2026-01-01"),
    dueDate: new Date("2026-08-05"),
    hasInstallments: false,
    installmentCount: 1,
    isRecurring: true,
    status: IncomeStatus.PENDING,
    installments: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("IncomesExportBuilder", () => {
  it("builds rows and totals from the user's incomes", async () => {
    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [
          incomeView(),
          incomeView({ idIncome: "income-2", totalAmount: 500 }),
        ],
        total: 2,
      }),
    };
    const builder = new IncomesExportBuilder(incomeRepository as never);

    const payload = await builder.build("user-1", "Stanley", {});

    expect(payload.rows[0]).toEqual([
      "Salário",
      "Trabalho",
      "Fixa",
      "05/08/2026",
      "Pendente",
      formatCurrencyBRL(3000),
    ]);
    expect(payload.totals).toEqual([
      { label: "Total", value: formatCurrencyBRL(3500) },
    ]);
  });

  it("forwards the status/type/category filters applied on screen", async () => {
    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    };
    const builder = new IncomesExportBuilder(incomeRepository as never);

    await builder.build("user-1", "Stanley", {
      incomeStatus: IncomeStatus.OVERDUE,
      incomeType: IncomeType.VARIABLE,
      idCategory: "cat-9",
    });

    expect(incomeRepository.listByUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        status: IncomeStatus.OVERDUE,
        incomeType: IncomeType.VARIABLE,
        idCategory: "cat-9",
      }),
    );
  });
});
