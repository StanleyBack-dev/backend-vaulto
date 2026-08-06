import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { UpdateIncomeDetailsUseCase } from "@/modules/incomes/application/use-cases/update/update-income-details.use-case";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

describe("UpdateIncomeDetailsUseCase", () => {
  it("should resolve the category name and forward the update when a valid income category is provided", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      updateDetails: jest.fn().mockResolvedValue({ idIncome: "income-1" }),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        status: true,
        type: CategoryType.INCOME,
        name: "Salário",
      }),
    };

    const useCase = new UpdateIncomeDetailsUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
    );

    await useCase.execute("user-1", {
      idIncome: "income-1",
      title: "Salário de setembro",
      idCategory: "category-1",
      incomeType: IncomeType.FIXED,
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(incomeRepository.updateDetails).toHaveBeenCalledWith("user-1", {
      idIncome: "income-1",
      title: "Salário de setembro",
      description: undefined,
      idCategory: "category-1",
      category: "Salário",
      incomeType: IncomeType.FIXED,
      dueDate: undefined,
      totalAmount: undefined,
      isRecurring: undefined,
    });
  });

  it("should skip category lookup entirely when idCategory is not provided", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      updateDetails: jest.fn().mockResolvedValue({ idIncome: "income-1" }),
    };

    const categoryRepository = {
      findById: jest.fn(),
    };

    const useCase = new UpdateIncomeDetailsUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
    );

    await useCase.execute("user-1", {
      idIncome: "income-1",
      title: "Novo título",
    });

    expect(categoryRepository.findById).not.toHaveBeenCalled();
    expect(incomeRepository.updateDetails).toHaveBeenCalledWith("user-1", {
      idIncome: "income-1",
      title: "Novo título",
      description: undefined,
      idCategory: undefined,
      category: undefined,
      incomeType: undefined,
      dueDate: undefined,
      totalAmount: undefined,
      isRecurring: undefined,
    });
  });

  it("should reject when the category does not exist or is inactive", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      updateDetails: jest.fn(),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };

    const useCase = new UpdateIncomeDetailsUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idIncome: "income-1",
        idCategory: "category-missing",
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(incomeRepository.updateDetails).not.toHaveBeenCalled();
  });

  it("should reject when the category is not of income type", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      updateDetails: jest.fn(),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-1",
        status: true,
        type: CategoryType.EXPENSE,
        name: "Moradia",
      }),
    };

    const useCase = new UpdateIncomeDetailsUseCase(
      authorizationService as never,
      incomeRepository as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idIncome: "income-1",
        idCategory: "category-1",
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(incomeRepository.updateDetails).not.toHaveBeenCalled();
  });
});
