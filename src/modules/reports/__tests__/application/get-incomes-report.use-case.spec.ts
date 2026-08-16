import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetIncomesReportUseCase } from "@/modules/reports/application/use-cases/get-incomes-report.use-case";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";
import type { IncomesReportView } from "@/modules/reports/application/ports/report-repository.port";

function buildUseCase(
  overrides: {
    report?: IncomesReportView;
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

  const report: IncomesReportView = overrides.report ?? {
    totalAmountDue: 1000,
    totalAmountReceived: 400,
    totalOutstanding: 600,
    totalCount: 3,
    countByStatus: {
      pending: 1,
      overdue: 0,
      partiallyReceived: 1,
      received: 1,
    },
  };

  const reportRepository = {
    getIncomesReport: jest.fn().mockResolvedValue(report),
  };

  const useCase = new GetIncomesReportUseCase(
    authorizationService as never,
    planLimitsService as never,
    reportRepository as never,
  );

  return {
    useCase,
    authorizationService,
    planLimitsService,
    reportRepository,
    report,
  };
}

describe("GetIncomesReportUseCase", () => {
  it("should assert read permission and the Pro plan, and return the repository's report", async () => {
    const {
      useCase,
      authorizationService,
      planLimitsService,
      reportRepository,
      report,
    } = buildUseCase();

    const filters = {
      dueDateFrom: new Date("2026-07-01"),
      dueDateTo: new Date("2026-07-31"),
      incomeType: IncomeType.FIXED,
      idCategory: "category-1",
    };

    const result = await useCase.execute("user-1", filters);

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
    expect(reportRepository.getIncomesReport).toHaveBeenCalledWith(
      "user-1",
      filters,
    );
    expect(result).toBe(report);
  });

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

  it("should work without filters", async () => {
    const { useCase, reportRepository, report } = buildUseCase();

    const result = await useCase.execute("user-1");

    expect(reportRepository.getIncomesReport).toHaveBeenCalledWith(
      "user-1",
      undefined,
    );
    expect(result).toBe(report);
  });
});
