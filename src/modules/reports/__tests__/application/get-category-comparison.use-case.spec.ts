import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetCategoryComparisonUseCase } from "@/modules/reports/application/use-cases/get-category-comparison.use-case";
import { CategoryComparisonPeriodType } from "@/modules/reports/domain/enums/category-comparison-period-type.enum";
import type { CategoryAmountRow } from "@/modules/reports/application/ports/report-repository.port";

function buildUseCase(
  overrides: {
    debtsByCategory?: CategoryAmountRow[][];
    incomesByCategory?: CategoryAmountRow[][];
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

  const debtsQueue = [...(overrides.debtsByCategory ?? [[], []])];
  const incomesQueue = [...(overrides.incomesByCategory ?? [[], []])];

  const reportRepository = {
    getDebtsAmountByCategory: jest
      .fn()
      .mockImplementation(() => Promise.resolve(debtsQueue.shift() ?? [])),
    getIncomesAmountByCategory: jest
      .fn()
      .mockImplementation(() => Promise.resolve(incomesQueue.shift() ?? [])),
  };

  const useCase = new GetCategoryComparisonUseCase(
    authorizationService as never,
    planLimitsService as never,
    reportRepository as never,
  );

  return { useCase, authorizationService, planLimitsService, reportRepository };
}

describe("GetCategoryComparisonUseCase", () => {
  it("asserts read permission and the Pro plan before comparing", async () => {
    const { useCase, authorizationService, planLimitsService } = buildUseCase();

    await useCase.execute("user-1", {});

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

    await expect(useCase.execute("user-1", {})).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("computes the current month window from the reference date and the previous month from it", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", {
      referenceDate: new Date("2026-03-15T12:00:00.000Z"),
    });

    const [currentCall, previousCall] =
      reportRepository.getDebtsAmountByCategory.mock.calls;

    expect(currentCall[1]).toEqual({
      dueDateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-03-31T00:00:00.000Z"),
    });
    expect(previousCall[1]).toEqual({
      dueDateFrom: new Date("2026-02-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-02-28T00:00:00.000Z"),
    });
  });

  it("uses an explicit comparisonDate instead of the previous month when provided", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", {
      referenceDate: new Date("2026-06-10T00:00:00.000Z"),
      comparisonDate: new Date("2025-01-20T00:00:00.000Z"),
    });

    const [currentCall, previousCall] =
      reportRepository.getDebtsAmountByCategory.mock.calls;

    expect(currentCall[1]).toEqual({
      dueDateFrom: new Date("2026-06-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-06-30T00:00:00.000Z"),
    });
    expect(previousCall[1]).toEqual({
      dueDateFrom: new Date("2025-01-01T00:00:00.000Z"),
      dueDateTo: new Date("2025-01-31T00:00:00.000Z"),
    });
  });

  it("aligns to calendar quarters and compares against the previous quarter", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", {
      periodType: CategoryComparisonPeriodType.QUARTER,
      referenceDate: new Date("2026-05-15T00:00:00.000Z"),
    });

    const [currentCall, previousCall] =
      reportRepository.getDebtsAmountByCategory.mock.calls;

    expect(currentCall[1]).toEqual({
      dueDateFrom: new Date("2026-04-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-06-30T00:00:00.000Z"),
    });
    expect(previousCall[1]).toEqual({
      dueDateFrom: new Date("2026-01-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-03-31T00:00:00.000Z"),
    });
  });

  it("aligns to calendar semesters and compares against the previous semester", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", {
      periodType: CategoryComparisonPeriodType.SEMESTER,
      referenceDate: new Date("2026-09-01T00:00:00.000Z"),
    });

    const [currentCall, previousCall] =
      reportRepository.getDebtsAmountByCategory.mock.calls;

    expect(currentCall[1]).toEqual({
      dueDateFrom: new Date("2026-07-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-12-31T00:00:00.000Z"),
    });
    expect(previousCall[1]).toEqual({
      dueDateFrom: new Date("2026-01-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-06-30T00:00:00.000Z"),
    });
  });

  it("compares full calendar years when periodType is YEAR", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", {
      periodType: CategoryComparisonPeriodType.YEAR,
      referenceDate: new Date("2026-05-15T00:00:00.000Z"),
    });

    const [currentCall, previousCall] =
      reportRepository.getDebtsAmountByCategory.mock.calls;

    expect(currentCall[1]).toEqual({
      dueDateFrom: new Date("2026-01-01T00:00:00.000Z"),
      dueDateTo: new Date("2026-12-31T00:00:00.000Z"),
    });
    expect(previousCall[1]).toEqual({
      dueDateFrom: new Date("2025-01-01T00:00:00.000Z"),
      dueDateTo: new Date("2025-12-31T00:00:00.000Z"),
    });
  });

  it("aligns an explicit comparisonDate to the same block size as the reference period", async () => {
    const { useCase, reportRepository } = buildUseCase();

    await useCase.execute("user-1", {
      periodType: CategoryComparisonPeriodType.QUARTER,
      referenceDate: new Date("2026-05-15T00:00:00.000Z"),
      comparisonDate: new Date("2025-11-01T00:00:00.000Z"),
    });

    const [, previousCall] =
      reportRepository.getDebtsAmountByCategory.mock.calls;

    expect(previousCall[1]).toEqual({
      dueDateFrom: new Date("2025-10-01T00:00:00.000Z"),
      dueDateTo: new Date("2025-12-31T00:00:00.000Z"),
    });
  });

  it("merges current and previous amounts by category and computes the percent change", async () => {
    const { useCase } = buildUseCase({
      debtsByCategory: [
        [{ idCategory: "cat-food", categoryName: "Alimentação", amount: 410 }],
        [{ idCategory: "cat-food", categoryName: "Alimentação", amount: 500 }],
      ],
    });

    const result = await useCase.execute("user-1", {});

    expect(result.expenses.categories).toEqual([
      {
        idCategory: "cat-food",
        categoryName: "Alimentação",
        currentAmount: 410,
        previousAmount: 500,
        changeAmount: -90,
        changePercent: -18,
      },
    ]);
    expect(result.expenses.currentTotal).toBe(410);
    expect(result.expenses.previousTotal).toBe(500);
    expect(result.expenses.changePercent).toBe(-18);
  });

  it("includes categories present only in one of the two months", async () => {
    const { useCase } = buildUseCase({
      debtsByCategory: [
        [{ idCategory: "cat-new", categoryName: "Novo", amount: 100 }],
        [{ idCategory: "cat-old", categoryName: "Antigo", amount: 50 }],
      ],
    });

    const result = await useCase.execute("user-1", {});
    const byId = new Map(
      result.expenses.categories.map((entry) => [entry.idCategory, entry]),
    );

    expect(byId.get("cat-new")).toEqual({
      idCategory: "cat-new",
      categoryName: "Novo",
      currentAmount: 100,
      previousAmount: 0,
      changeAmount: 100,
      changePercent: null,
    });
    expect(byId.get("cat-old")).toEqual({
      idCategory: "cat-old",
      categoryName: "Antigo",
      currentAmount: 0,
      previousAmount: 50,
      changeAmount: -50,
      changePercent: -100,
    });
  });

  it("returns 0% change when both months are zero for a group total", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute("user-1", {});

    expect(result.expenses.changePercent).toBe(0);
    expect(result.income.changePercent).toBe(0);
  });
});
