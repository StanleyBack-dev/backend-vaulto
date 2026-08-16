import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetFinancialForecastUseCase } from "@/modules/reports/application/use-cases/get-financial-forecast.use-case";
import type {
  DebtsReportView,
  IncomesReportView,
} from "@/modules/reports/application/ports/report-repository.port";

function debtsReport(
  overrides: Partial<DebtsReportView> = {},
): DebtsReportView {
  return {
    totalAmountDue: 0,
    totalAmountPaid: 0,
    totalOutstanding: 0,
    totalCount: 0,
    countByStatus: { open: 0, overdue: 0, partiallyPaid: 0, paid: 0 },
    ...overrides,
  };
}

function incomesReport(
  overrides: Partial<IncomesReportView> = {},
): IncomesReportView {
  return {
    totalAmountDue: 0,
    totalAmountReceived: 0,
    totalOutstanding: 0,
    totalCount: 0,
    countByStatus: {
      pending: 0,
      overdue: 0,
      partiallyReceived: 0,
      received: 0,
    },
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    debtsReport?: DebtsReportView;
    incomesReport?: IncomesReportView;
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
    getDebtsReport: jest
      .fn()
      .mockResolvedValue(overrides.debtsReport ?? debtsReport()),
    getIncomesReport: jest
      .fn()
      .mockResolvedValue(overrides.incomesReport ?? incomesReport()),
  };

  const useCase = new GetFinancialForecastUseCase(
    authorizationService as never,
    planLimitsService as never,
    reportRepository as never,
  );

  return { useCase, authorizationService, planLimitsService, reportRepository };
}

describe("GetFinancialForecastUseCase", () => {
  it("asserts read permission and the Pro plan before computing the forecast", async () => {
    const { useCase, authorizationService, planLimitsService } = buildUseCase();

    await useCase.execute("user-1", { currentBalance: 100 });

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
      useCase.execute("user-1", { currentBalance: 100 }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("computes safeToSpend as currentBalance + projected income - projected expenses", async () => {
    const { useCase } = buildUseCase({
      debtsReport: debtsReport({ totalOutstanding: 300 }),
      incomesReport: incomesReport({ totalOutstanding: 500 }),
    });

    const result = await useCase.execute("user-1", { currentBalance: 1000 });

    expect(result.projectedIncome).toBe(500);
    expect(result.projectedExpenses).toBe(300);
    expect(result.safeToSpend).toBe(1200);
  });

  it("allows safeToSpend to go negative when expenses exceed balance and income", async () => {
    const { useCase } = buildUseCase({
      debtsReport: debtsReport({ totalOutstanding: 2000 }),
      incomesReport: incomesReport({ totalOutstanding: 100 }),
    });

    const result = await useCase.execute("user-1", { currentBalance: 50 });

    expect(result.safeToSpend).toBe(-1850);
  });

  it("defaults the period to today through 30 days from now when not provided", async () => {
    const { useCase, reportRepository } = buildUseCase();
    const before = Date.now();

    const result = await useCase.execute("user-1", { currentBalance: 0 });

    const periodEnd = reportRepository.getDebtsReport.mock.calls[0][1]
      .dueDateTo as Date;

    expect(result.periodStart.getTime()).toBeGreaterThanOrEqual(before);
    expect(periodEnd.getTime() - result.periodStart.getTime()).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
    expect(result.periodEnd).toEqual(periodEnd);
  });

  it("uses the provided periodEnd instead of the default window", async () => {
    const { useCase, reportRepository } = buildUseCase();
    const periodStart = new Date("2026-09-01");
    const periodEnd = new Date("2026-09-10");

    await useCase.execute("user-1", {
      currentBalance: 0,
      periodStart,
      periodEnd,
    });

    expect(reportRepository.getDebtsReport).toHaveBeenCalledWith("user-1", {
      dueDateTo: periodEnd,
    });
    expect(reportRepository.getIncomesReport).toHaveBeenCalledWith("user-1", {
      dueDateTo: periodEnd,
    });
  });

  it("never sends a dueDateFrom floor, so overdue installments are still counted", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", { currentBalance: 0 });

    const debtsFilters = reportRepository.getDebtsReport.mock.calls[0][1];
    const incomesFilters = reportRepository.getIncomesReport.mock.calls[0][1];

    expect(debtsFilters).not.toHaveProperty("dueDateFrom");
    expect(incomesFilters).not.toHaveProperty("dueDateFrom");
  });
});
