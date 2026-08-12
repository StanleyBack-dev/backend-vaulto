import { AppException } from "@/common/exceptions/app-exception";
import { formatCurrencyBRL } from "@/utils/pdf";
import type { DebtView } from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import type { IncomeView } from "@/modules/incomes/application/ports/income-repository.port";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import { StatementScope } from "../../domain/enums/statement-scope.enum";
import { StatementExportBuilder } from "../../application/builders/statement-export.builder";

function debtView(overrides: Partial<DebtView> = {}): DebtView {
  return {
    idDebt: "debt-1",
    idUsers: "user-1",
    idCategory: "cat-1",
    title: "Cartão",
    category: "Cartão de crédito",
    debtType: DebtType.FIXED,
    totalAmount: 300,
    startDate: new Date("2026-01-01"),
    hasInstallments: true,
    installmentCount: 1,
    status: DebtStatus.OPEN,
    installments: [
      {
        idDebtInstallment: "di-1",
        idDebt: "debt-1",
        installmentNumber: 1,
        amountDue: 300,
        amountPaid: 0,
        dueDate: new Date("2026-08-15"),
        status: DebtStatus.OPEN,
      },
    ],
    payments: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function incomeView(overrides: Partial<IncomeView> = {}): IncomeView {
  return {
    idIncome: "income-1",
    idUsers: "user-1",
    idCategory: "cat-2",
    title: "Salário",
    category: "Trabalho",
    incomeType: IncomeType.FIXED,
    totalAmount: 3000,
    startDate: new Date("2026-01-01"),
    hasInstallments: true,
    installmentCount: 1,
    isRecurring: true,
    status: IncomeStatus.PENDING,
    installments: [
      {
        idIncomeInstallment: "ii-1",
        idIncome: "income-1",
        installmentNumber: 1,
        amountDue: 3000,
        amountReceived: 3000,
        dueDate: new Date("2026-08-05"),
        status: IncomeStatus.RECEIVED,
      },
    ],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function buildBuilder(
  debtRecords: DebtView[] = [debtView()],
  incomeRecords: IncomeView[] = [incomeView()],
) {
  const debtRepository = {
    listByUser: jest.fn().mockResolvedValue({ records: debtRecords, total: debtRecords.length }),
  };
  const incomeRepository = {
    listByUser: jest
      .fn()
      .mockResolvedValue({ records: incomeRecords, total: incomeRecords.length }),
  };
  return {
    builder: new StatementExportBuilder(
      debtRepository as never,
      incomeRepository as never,
    ),
    debtRepository,
    incomeRepository,
  };
}

describe("StatementExportBuilder", () => {
  it("rejects when the period is not informed", async () => {
    const { builder } = buildBuilder();

    await expect(
      builder.build("user-1", "Stanley", {}),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("combines debts and incomes sorted by due date", async () => {
    const { builder } = buildBuilder();

    const payload = await builder.build("user-1", "Stanley", {
      dueDateFrom: new Date("2026-08-01"),
      dueDateTo: new Date("2026-08-31"),
    });

    expect(payload.rows).toEqual([
      [
        "Receita",
        "Salário",
        "Trabalho",
        "1/1",
        "05/08/2026",
        formatCurrencyBRL(3000),
        formatCurrencyBRL(3000),
        "Recebida",
      ],
      [
        "Dívida",
        "Cartão",
        "Cartão de crédito",
        "1/1",
        "15/08/2026",
        formatCurrencyBRL(300),
        formatCurrencyBRL(0),
        "Em aberto",
      ],
    ]);
    expect(payload.totals).toEqual([
      { label: "Total previsto", value: formatCurrencyBRL(3300) },
      { label: "Total realizado", value: formatCurrencyBRL(3000) },
    ]);
  });

  it("only fetches debts when the scope is DEBTS", async () => {
    const { builder, incomeRepository } = buildBuilder();

    const payload = await builder.build("user-1", "Stanley", {
      dueDateFrom: new Date("2026-08-01"),
      dueDateTo: new Date("2026-08-31"),
      statementScope: StatementScope.DEBTS,
    });

    expect(incomeRepository.listByUser).not.toHaveBeenCalled();
    expect(payload.rows).toHaveLength(1);
    expect(payload.rows[0][0]).toBe("Dívida");
  });

  it("excludes installments outside the requested period", async () => {
    const outOfRangeDebt = debtView({
      installments: [
        {
          idDebtInstallment: "di-2",
          idDebt: "debt-1",
          installmentNumber: 1,
          amountDue: 300,
          amountPaid: 0,
          dueDate: new Date("2026-09-15"),
          status: DebtStatus.OPEN,
        },
      ],
    });
    const { builder } = buildBuilder([outOfRangeDebt], []);

    const payload = await builder.build("user-1", "Stanley", {
      dueDateFrom: new Date("2026-08-01"),
      dueDateTo: new Date("2026-08-31"),
    });

    expect(payload.rows).toHaveLength(0);
    expect(payload.totals).toEqual([]);
  });
});
