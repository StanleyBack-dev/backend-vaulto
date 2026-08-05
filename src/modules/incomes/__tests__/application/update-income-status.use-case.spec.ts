import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { UpdateIncomeStatusUseCase } from "@/modules/incomes/application/use-cases/update/update-income-status.use-case";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

describe("UpdateIncomeStatusUseCase", () => {
  it("should update income status manually to overdue", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      updateStatus: jest.fn().mockResolvedValue({
        idIncome: "income-1",
        idUsers: "user-1",
        idCategory: "category-1",
        category: "Freelance",
        title: "Projeto site",
        incomeType: IncomeType.VARIABLE,
        expectedAmount: 1500,
        expectedDate: new Date("2026-08-01"),
        receivedAmount: 0,
        isRecurring: false,
        status: IncomeStatus.OVERDUE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const useCase = new UpdateIncomeStatusUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idIncome: "income-1",
      status: IncomeStatus.OVERDUE,
    });

    expect(result.status).toBe(IncomeStatus.OVERDUE);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
  });

  it("should reject manual received status", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      updateStatus: jest.fn(),
    };

    const useCase = new UpdateIncomeStatusUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idIncome: "income-1",
        status: IncomeStatus.RECEIVED,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(incomeRepository.updateStatus).not.toHaveBeenCalled();
  });
});
