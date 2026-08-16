import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetMonthlyCashflowTrendUseCase } from "@/modules/reports/application/use-cases/get-monthly-cashflow-trend.use-case";
import type { MonthlyAmountRow } from "@/modules/reports/application/ports/report-repository.port";

function buildUseCase(
  overrides: {
    expenseRows?: MonthlyAmountRow[];
    incomeRows?: MonthlyAmountRow[];
    assertProPlan?: () => Promise<void>;
  } = {},
) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const planLimitsService = {
    assertProPlan:
      overrides.assertProPlan ?? jest.fn().mockResolvedValue(undefined),
  };

  const reportRepository = {
    getDebtsPaidAmountByMonth: jest
      .fn()
      .mockResolvedValue(overrides.expenseRows ?? []),
    getIncomesReceivedAmountByMonth: jest
      .fn()
      .mockResolvedValue(overrides.incomeRows ?? []),
  };

  const useCase = new GetMonthlyCashflowTrendUseCase(
    authorizationService as never,
    planLimitsService as never,
    reportRepository as never,
  );

  return { useCase, authorizationService, planLimitsService, reportRepository };
}

describe("GetMonthlyCashflowTrendUseCase", () => {
  it("asserts read permission and the Pro plan before computing the trend", async () => {
    const { useCase, authorizationService, planLimitsService } = buildUseCase();

    await useCase.execute("user-1", {
      dueDateFrom: new Date("2026-01-01"),
      dueDateTo: new Date("2026-01-31"),
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
  });

  it("rejects when the user is not on the Pro plan", async () => {
    const { useCase } = buildUseCase({
      assertProPlan: jest
        .fn()
        .mockRejectedValue(
          new AppException({ code: "X", status: 403, message: "no" }, "no"),
        ),
    });

    await expect(
      useCase.execute("user-1", {
        dueDateFrom: new Date("2026-01-01"),
        dueDateTo: new Date("2026-01-31"),
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("fills every month in the range, even ones with no installments", async () => {
    const { useCase } = buildUseCase({
      expenseRows: [{ month: "2026-01", amount: 500 }],
      incomeRows: [{ month: "2026-03", amount: 900 }],
    });

    const result = await useCase.execute("user-1", {
      dueDateFrom: new Date("2026-01-01"),
      dueDateTo: new Date("2026-03-31"),
    });

    expect(result.map((point) => point.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(result[1]).toEqual({
      month: "2026-02",
      expenses: 0,
      income: 0,
      balance: 0,
    });
  });

  it("computes balance as income minus expenses per month", async () => {
    const { useCase } = buildUseCase({
      expenseRows: [{ month: "2026-01", amount: 300 }],
      incomeRows: [{ month: "2026-01", amount: 500 }],
    });

    const result = await useCase.execute("user-1", {
      dueDateFrom: new Date("2026-01-01"),
      dueDateTo: new Date("2026-01-31"),
    });

    expect(result).toEqual([
      { month: "2026-01", expenses: 300, income: 500, balance: 200 },
    ]);
  });

  it("handles a range spanning across a year boundary", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute("user-1", {
      dueDateFrom: new Date("2025-12-01"),
      dueDateTo: new Date("2026-02-28"),
    });

    expect(result.map((point) => point.month)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});
