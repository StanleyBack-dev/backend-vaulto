import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

describe("GetDebtByIdUseCase", () => {
  it("should return the debt when found", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      findById: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        idUsers: "user-1",
        idCategory: "category-1",
        title: "Financiamento",
        category: "Financiamento",
        debtType: DebtType.FIXED,
        totalAmount: 1000,
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

    const useCase = new GetDebtByIdUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    const result = await useCase.execute("user-1", { idDebt: "debt-1" });

    expect(result.idDebt).toBe("debt-1");
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(debtRepository.findById).toHaveBeenCalledWith("user-1", "debt-1");
  });

  it("should propagate a not-found error from the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      findById: jest
        .fn()
        .mockRejectedValue(
          AppException.from(APP_ERRORS.debts.notFound, undefined),
        ),
    };

    const useCase = new GetDebtByIdUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    await expect(
      useCase.execute("user-1", { idDebt: "missing-debt" }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
