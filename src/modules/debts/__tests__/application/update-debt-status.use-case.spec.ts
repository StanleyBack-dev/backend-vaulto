import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

describe("UpdateDebtStatusUseCase", () => {
  it("should update debt status manually to overdue", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      updateStatus: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        idUsers: "user-1",
        title: "Emprestimo",
        debtType: DebtType.VARIABLE,
        totalAmount: 2000,
        startDate: new Date("2026-07-01"),
        hasInstallments: true,
        installmentCount: 10,
        status: DebtStatus.OVERDUE,
        settledAt: undefined,
        installments: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const useCase = new UpdateDebtStatusUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idDebt: "debt-1",
      status: DebtStatus.OVERDUE,
    });

    expect(result.status).toBe(DebtStatus.OVERDUE);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
  });

  it("should reject manual paid status", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      updateStatus: jest.fn(),
    };

    const useCase = new UpdateDebtStatusUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idDebt: "debt-1",
        status: DebtStatus.PAID,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(debtRepository.updateStatus).not.toHaveBeenCalled();
  });
});

