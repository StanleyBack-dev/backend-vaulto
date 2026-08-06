import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import type { DebtsReportView } from "@/modules/reports/application/ports/report-repository.port";

describe("GetDebtsReportUseCase", () => {
  it("should assert read permission and return the repository's report", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const report: DebtsReportView = {
      totalAmountDue: 1000,
      totalAmountPaid: 400,
      totalOutstanding: 600,
      totalCount: 3,
      countByStatus: {
        open: 1,
        overdue: 0,
        partiallyPaid: 1,
        paid: 1,
      },
    };

    const reportRepository = {
      getDebtsReport: jest.fn().mockResolvedValue(report),
    };

    const useCase = new GetDebtsReportUseCase(
      authorizationService as never,
      reportRepository as never,
    );

    const filters = {
      dueDateFrom: new Date("2026-07-01"),
      dueDateTo: new Date("2026-07-31"),
      debtType: DebtType.FIXED,
      idCategory: "category-1",
    };

    const result = await useCase.execute("user-1", filters);

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(reportRepository.getDebtsReport).toHaveBeenCalledWith(
      "user-1",
      filters,
    );
    expect(result).toBe(report);
  });

  it("should work without filters", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const report: DebtsReportView = {
      totalAmountDue: 0,
      totalAmountPaid: 0,
      totalOutstanding: 0,
      totalCount: 0,
      countByStatus: { open: 0, overdue: 0, partiallyPaid: 0, paid: 0 },
    };

    const reportRepository = {
      getDebtsReport: jest.fn().mockResolvedValue(report),
    };

    const useCase = new GetDebtsReportUseCase(
      authorizationService as never,
      reportRepository as never,
    );

    const result = await useCase.execute("user-1");

    expect(reportRepository.getDebtsReport).toHaveBeenCalledWith(
      "user-1",
      undefined,
    );
    expect(result).toBe(report);
  });
});
