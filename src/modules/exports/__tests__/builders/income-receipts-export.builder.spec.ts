import { AppException } from "@/common/exceptions/app-exception";
import { formatCurrencyBRL } from "@/utils/pdf";
import type { IncomeView } from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import { IncomeReceiptsExportBuilder } from "../../application/builders/income-receipts-export.builder";

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
    hasInstallments: true,
    installmentCount: 1,
    isRecurring: false,
    status: IncomeStatus.RECEIVED,
    installments: [
      {
        idIncomeInstallment: "ii-1",
        idIncome: "income-1",
        installmentNumber: 1,
        amountDue: 3000,
        amountReceived: 3000,
        dueDate: new Date("2026-08-05"),
        receivedAt: new Date("2026-08-05T15:00:00.000Z"),
        status: IncomeStatus.RECEIVED,
      },
    ],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("IncomeReceiptsExportBuilder", () => {
  it("rejects when no income is selected", async () => {
    const incomeRepository = { findById: jest.fn() };
    const builder = new IncomeReceiptsExportBuilder(incomeRepository as never);

    await expect(
      builder.build("user-1", "Stanley", {}),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("builds one row per installment with due/received totals", async () => {
    const incomeRepository = {
      findById: jest.fn().mockResolvedValue(incomeView()),
    };
    const builder = new IncomeReceiptsExportBuilder(incomeRepository as never);

    const payload = await builder.build("user-1", "Stanley", {
      idIncome: "income-1",
    });

    expect(incomeRepository.findById).toHaveBeenCalledWith(
      "user-1",
      "income-1",
    );
    expect(payload.rows).toEqual([
      [
        "1/1",
        "05/08/2026",
        formatCurrencyBRL(3000),
        formatCurrencyBRL(3000),
        "05/08/2026",
        "Recebida",
      ],
    ]);
    expect(payload.totals).toEqual([
      { label: "Total devido", value: formatCurrencyBRL(3000) },
      { label: "Total recebido", value: formatCurrencyBRL(3000) },
    ]);
  });
});
