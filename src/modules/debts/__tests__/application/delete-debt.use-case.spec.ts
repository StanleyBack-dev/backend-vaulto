import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { DeleteDebtUseCase } from "@/modules/debts/application/use-cases/delete/delete-debt.use-case";

describe("DeleteDebtUseCase", () => {
  it("should assert permission and delegate deletion to the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new DeleteDebtUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    await useCase.execute("user-1", "debt-1");

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(debtRepository.delete).toHaveBeenCalledWith("user-1", "debt-1");
  });
});
