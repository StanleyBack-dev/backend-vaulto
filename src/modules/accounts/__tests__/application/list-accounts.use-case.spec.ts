import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ListAccountsUseCase } from "@/modules/accounts/application/use-cases/get/list-accounts.use-case";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";

describe("ListAccountsUseCase", () => {
  it("should list user accounts", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const accountRepository = {
      listByUser: jest.fn().mockResolvedValue([
        {
          idAccount: "account-1",
          idUsers: "user-1",
          name: "Banco",
          accountType: AccountType.BANK,
          initialBalance: 200,
          currentBalance: 350,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };

    const useCase = new ListAccountsUseCase(
      authorizationService as never,
      accountRepository as never,
    );

    const result = await useCase.execute("user-1");

    expect(result).toHaveLength(1);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_ACCOUNTS,
    );
  });
});

