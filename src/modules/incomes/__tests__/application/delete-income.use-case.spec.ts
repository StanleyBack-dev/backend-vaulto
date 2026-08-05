import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { DeleteIncomeUseCase } from "@/modules/incomes/application/use-cases/delete/delete-income.use-case";

describe("DeleteIncomeUseCase", () => {
  it("should assert permission and delegate deletion to the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new DeleteIncomeUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    await useCase.execute("user-1", "income-1");

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(incomeRepository.delete).toHaveBeenCalledWith("user-1", "income-1");
  });
});
