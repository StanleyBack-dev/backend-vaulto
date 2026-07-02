import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";
import { TransferBetweenAccountsUseCase } from "@/modules/accounts/application/use-cases/transfer/transfer-between-accounts.use-case";

describe("TransferBetweenAccountsUseCase", () => {
  it("should transfer between accounts", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const accountRepository = {
      transferBetweenAccounts: jest.fn().mockResolvedValue({
        sourceAccount: {
          idAccount: "account-1",
          idUsers: "user-1",
          name: "Carteira",
          accountType: AccountType.WALLET,
          initialBalance: 500,
          currentBalance: 350,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        destinationAccount: {
          idAccount: "account-2",
          idUsers: "user-1",
          name: "Banco",
          accountType: AccountType.BANK,
          initialBalance: 100,
          currentBalance: 250,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        transfer: {
          idAccountTransfer: "transfer-1",
          idUsers: "user-1",
          sourceAccountId: "account-1",
          destinationAccountId: "account-2",
          amount: 150,
          transferredAt: new Date(),
          createdAt: new Date(),
        },
      }),
    };

    const useCase = new TransferBetweenAccountsUseCase(
      authorizationService as never,
      accountRepository as never,
    );

    const result = await useCase.execute("user-1", {
      sourceAccountId: "account-1",
      destinationAccountId: "account-2",
      amount: 150,
    });

    expect(result.transfer.amount).toBe(150);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_ACCOUNTS,
    );
  });

  it("should reject same source and destination", async () => {
    const useCase = new TransferBetweenAccountsUseCase(
      {
        assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
      } as never,
      {
        transferBetweenAccounts: jest.fn(),
      } as never,
    );

    await expect(
      useCase.execute("user-1", {
        sourceAccountId: "account-1",
        destinationAccountId: "account-1",
        amount: 10,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});

