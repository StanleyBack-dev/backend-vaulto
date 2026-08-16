import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetIncomesAmountByCategoryUseCase } from "@/modules/reports/application/use-cases/get-incomes-amount-by-category.use-case";
import type { CategoryAmountRow } from "@/modules/reports/application/ports/report-repository.port";

function buildUseCase(
  overrides: {
    rows?: CategoryAmountRow[];
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

  const rows: CategoryAmountRow[] = overrides.rows ?? [
    { idCategory: "category-3", categoryName: "Salário", amount: 4500 },
    { idCategory: "category-4", categoryName: "Freelance", amount: 900 },
  ];

  const reportRepository = {
    getIncomesAmountByCategory: jest.fn().mockResolvedValue(rows),
  };

  const useCase = new GetIncomesAmountByCategoryUseCase(
    authorizationService as never,
    planLimitsService as never,
    reportRepository as never,
  );

  return {
    useCase,
    authorizationService,
    planLimitsService,
    reportRepository,
    rows,
  };
}

describe("GetIncomesAmountByCategoryUseCase", () => {
  it("should assert read permission and the Pro plan, and return the repository's rows", async () => {
    const {
      useCase,
      authorizationService,
      planLimitsService,
      reportRepository,
      rows,
    } = buildUseCase();

    const filters = {
      dueDateFrom: new Date("2026-07-01"),
      dueDateTo: new Date("2026-07-31"),
    };

    const result = await useCase.execute("user-1", filters);

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(planLimitsService.assertProPlan).toHaveBeenCalledWith("user-1");
    expect(reportRepository.getIncomesAmountByCategory).toHaveBeenCalledWith(
      "user-1",
      filters,
    );
    expect(result).toBe(rows);
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
        dueDateFrom: new Date("2026-07-01"),
        dueDateTo: new Date("2026-07-31"),
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
