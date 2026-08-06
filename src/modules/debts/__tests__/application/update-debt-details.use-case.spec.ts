import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { UpdateDebtDetailsUseCase } from "@/modules/debts/application/use-cases/update/update-debt-details.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

describe("UpdateDebtDetailsUseCase", () => {
  it("should update debt details when category is valid", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      updateDetails: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        idUsers: "user-1",
        idCategory: "category-2",
        title: "Novo titulo",
        category: "Nova categoria",
        debtType: DebtType.FIXED,
        totalAmount: 500,
        startDate: new Date("2026-07-01"),
        hasInstallments: false,
        installmentCount: 1,
        status: DebtStatus.OPEN,
        installments: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue({
        idCategory: "category-2",
        status: true,
        type: CategoryType.EXPENSE,
        name: "Nova categoria",
      }),
    };

    const useCase = new UpdateDebtDetailsUseCase(
      authorizationService as never,
      debtRepository as never,
      categoryRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idDebt: "debt-1",
      title: "Novo titulo",
      idCategory: "category-2",
      totalAmount: 500,
    });

    expect(result.title).toBe("Novo titulo");
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(categoryRepository.findById).toHaveBeenCalledWith(
      "user-1",
      "category-2",
    );
    expect(debtRepository.updateDetails).toHaveBeenCalledWith("user-1", {
      idDebt: "debt-1",
      title: "Novo titulo",
      description: undefined,
      idCategory: "category-2",
      category: "Nova categoria",
      debtType: undefined,
      acquiredAt: undefined,
      dueDate: undefined,
      totalAmount: 500,
    });
  });

  it("should reject an invalid totalAmount", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      updateDetails: jest.fn(),
    };

    const categoryRepository = {
      findById: jest.fn(),
    };

    const useCase = new UpdateDebtDetailsUseCase(
      authorizationService as never,
      debtRepository as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idDebt: "debt-1",
        totalAmount: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(debtRepository.updateDetails).not.toHaveBeenCalled();
  });

  it("should reject when the new category does not exist or is inactive", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      updateDetails: jest.fn(),
    };

    const categoryRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };

    const useCase = new UpdateDebtDetailsUseCase(
      authorizationService as never,
      debtRepository as never,
      categoryRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idDebt: "debt-1",
        idCategory: "category-missing",
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(debtRepository.updateDetails).not.toHaveBeenCalled();
  });
});
