import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import { CreateIncomeUseCase } from "@/modules/incomes/application/use-cases/create/create-income.use-case";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

describe("CreateIncomeUseCase", () => {
  it("should create income when category is valid and of income type", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const planLimitsService = {
      assertCanCreate: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
      create: jest.fn().mockResolvedValue({
        idIncome: "income-1",
        idUsers: "user-1",
        idCategory: "category-1",
        category: "Salário",
        title: "Salário de agosto",
        incomeType: IncomeType.FIXED,
        totalAmount: 5000,
        startDate: new Date("2026-08-05"),
        dueDate: new Date("2026-08-05"),
        hasInstallments: false,
        installmentCount: 1,
        isRecurring: true,
        status: IncomeStatus.PENDING,
        installments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        status: true,
        type: CategoryType.INCOME,
        name: "Salário",
      }),
    };

    const useCase = new CreateIncomeUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
      planLimitsService as never,
    );

    const result = await useCase.execute("user-1", {
      title: "Salário de agosto",
      idCategory: "category-1",
      incomeType: IncomeType.FIXED,
      totalAmount: 5000,
      dueDate: new Date("2026-08-05"),
      hasInstallments: false,
      isRecurring: true,
    });

    expect(result.idIncome).toBe("income-1");
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(planLimitsService.assertCanCreate).toHaveBeenCalledWith(
      "user-1",
      PlanLimitedResource.INCOMES,
      0,
    );
    expect(incomeRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should reject when the category is not of income type", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const planLimitsService = {
      assertCanCreate: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
      create: jest.fn(),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        status: true,
        type: CategoryType.EXPENSE,
        name: "Moradia",
      }),
    };

    const useCase = new CreateIncomeUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
      planLimitsService as never,
    );

    await expect(
      useCase.execute("user-1", {
        title: "Salário de agosto",
        idCategory: "category-1",
        incomeType: IncomeType.FIXED,
        totalAmount: 5000,
        dueDate: new Date("2026-08-05"),
        hasInstallments: false,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(incomeRepository.create).not.toHaveBeenCalled();
  });

  it("should reject creation when the Free plan limit was reached", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const planLimitsService = {
      assertCanCreate: jest.fn().mockRejectedValue(
        AppException.from(APP_ERRORS.billing.planLimitReached, {
          resource: "receitas",
          limit: 10,
        }),
      ),
    };

    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 10 }),
      create: jest.fn(),
    };

    const categoryRepository = {
      findById: jest.fn(),
    };

    const useCase = new CreateIncomeUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
      planLimitsService as never,
    );

    await expect(
      useCase.execute("user-1", {
        title: "Décima primeira receita",
        idCategory: "category-1",
        incomeType: IncomeType.FIXED,
        totalAmount: 100,
        dueDate: new Date("2026-08-05"),
        hasInstallments: false,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(categoryRepository.findById).not.toHaveBeenCalled();
    expect(incomeRepository.create).not.toHaveBeenCalled();
  });
});
