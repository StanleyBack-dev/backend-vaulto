import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetIncomeByIdUseCase } from "@/modules/incomes/application/use-cases/get/get-income-by-id.use-case";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

describe("GetIncomeByIdUseCase", () => {
  it("should return the income when found", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const income = {
      idIncome: "income-1",
      idUsers: "user-1",
      idCategory: "category-1",
      category: "Freelance",
      title: "Projeto site",
      incomeType: IncomeType.VARIABLE,
      totalAmount: 1000,
      startDate: new Date("2026-08-05"),
      hasInstallments: false,
      installmentCount: 1,
      isRecurring: false,
      status: IncomeStatus.PENDING,
      installments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const incomeRepository = {
      findById: jest.fn().mockResolvedValue(income),
    };

    const useCase = new GetIncomeByIdUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    const result = await useCase.execute("user-1", { idIncome: "income-1" });

    expect(result).toBe(income);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(incomeRepository.findById).toHaveBeenCalledWith(
      "user-1",
      "income-1",
    );
  });

  it("should propagate the not-found error from the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      findById: jest
        .fn()
        .mockRejectedValue(
          AppException.from(APP_ERRORS.incomes.notFound, undefined),
        ),
    };

    const useCase = new GetIncomeByIdUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    await expect(
      useCase.execute("user-1", { idIncome: "missing" }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
