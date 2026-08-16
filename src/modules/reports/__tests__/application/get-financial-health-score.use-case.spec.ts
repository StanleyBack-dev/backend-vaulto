import { AppException } from "@/common/exceptions/app-exception";
import { GetFinancialHealthScoreUseCase } from "@/modules/reports/application/use-cases/get-financial-health-score.use-case";
import type {
  DebtsReportView,
  IncomesReportView,
} from "@/modules/reports/application/ports/report-repository.port";
import type { FinancialGoalView } from "@/modules/goals/application/ports/financial-goal-repository.port";

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

function goalView(
  overrides: Partial<FinancialGoalView> = {},
): FinancialGoalView {
  return {
    idFinancialGoal: "goal-1",
    idUsers: "user-1",
    title: "Viagem",
    targetAmount: 1000,
    currentAmount: 0,
    contributions: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    debtsReport?: DebtsReportView;
    incomesReport?: IncomesReportView;
    goals?: FinancialGoalView[];
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

  const goalRepository = {
    listByUser: jest.fn().mockResolvedValue({
      records: overrides.goals ?? [],
      total: overrides.goals?.length ?? 0,
    }),
  };

  const useCase = new GetFinancialHealthScoreUseCase(
    authorizationService as never,
    planLimitsService as never,
    reportRepository as never,
    goalRepository as never,
  );

  return {
    useCase,
    authorizationService,
    planLimitsService,
    reportRepository,
    goalRepository,
  };
}

describe("GetFinancialHealthScoreUseCase", () => {
  it("rejects when the user is not on the Pro plan", async () => {
    const { useCase } = buildUseCase({
      assertProPlan: jest
        .fn()
        .mockRejectedValue(
          new AppException({ code: "X", status: 403, message: "no" }, "no"),
        ),
    });

    await expect(useCase.execute("user-1")).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("scores a debt-free user with no goals at 100", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute("user-1");

    expect(result.score).toBe(100);
    expect(result.reserves).toBeNull();
  });

  it("averages progress across all goals for the reserves pillar", async () => {
    const { useCase } = buildUseCase({
      goals: [
        goalView({ targetAmount: 1000, currentAmount: 1000 }), // 100%
        goalView({
          idFinancialGoal: "goal-2",
          targetAmount: 1000,
          currentAmount: 0,
        }), // 0%
      ],
    });

    const result = await useCase.execute("user-1");

    expect(result.reserves).toEqual({ score: 50, weight: 0.2 });
  });

  it("queries the next 30 days from today, consistent with the forecast window", async () => {
    const { useCase, reportRepository } = buildUseCase();
    const before = Date.now();

    await useCase.execute("user-1");

    const periodEnd = reportRepository.getDebtsReport.mock.calls[0][1]
      .dueDateTo as Date;

    expect(periodEnd.getTime() - before).toBeGreaterThanOrEqual(
      30 * 24 * 60 * 60 * 1000 - 1000,
    );
    expect(reportRepository.getIncomesReport).toHaveBeenCalledWith("user-1", {
      dueDateTo: periodEnd,
    });
  });

  it("uses the provided periodEnd instead of the default 30-day window", async () => {
    const { useCase, reportRepository } = buildUseCase();
    const periodEnd = new Date("2026-09-10");

    const result = await useCase.execute("user-1", { periodEnd });

    expect(reportRepository.getDebtsReport).toHaveBeenCalledWith("user-1", {
      dueDateTo: periodEnd,
    });
    expect(reportRepository.getIncomesReport).toHaveBeenCalledWith("user-1", {
      dueDateTo: periodEnd,
    });
    expect(result.periodEnd).toEqual(periodEnd);
  });
});
