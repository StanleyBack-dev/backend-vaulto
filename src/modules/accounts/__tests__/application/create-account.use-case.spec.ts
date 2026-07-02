import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CreateAccountUseCase } from "@/modules/accounts/application/use-cases/create/create-account.use-case";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

describe("CreateAccountUseCase", () => {
  it("should create account", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const accountRepository = {
      create: jest.fn().mockResolvedValue({
        idAccount: "account-1",
        idUsers: "user-1",
        name: "Carteira",
        accountType: AccountType.WALLET,
        initialBalance: 100,
        currentBalance: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const useCase = new CreateAccountUseCase(
      authorizationService as never,
      accountRepository as never,
    );

    const result = await useCase.execute("user-1", {
      name: "Carteira",
      accountType: AccountType.WALLET,
      initialBalance: 100,
    });

    expect(result.idAccount).toBe("account-1");
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_ACCOUNTS,
    );
  });
});

