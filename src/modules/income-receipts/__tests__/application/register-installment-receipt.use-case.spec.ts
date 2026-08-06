import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { RegisterInstallmentReceiptUseCase } from "@/modules/income-receipts/application/use-cases/register-installment-receipt.use-case";
import { AppException } from "@/common/exceptions/app-exception";

describe("RegisterInstallmentReceiptUseCase", () => {
  it("registers a receipt for the chosen installment", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeReceiptRepository = {
      registerInstallmentReceipt: jest.fn().mockResolvedValue({
        idIncome: "income-1",
        incomeStatus: IncomeStatus.PARTIALLY_RECEIVED,
        receipts: [],
        installments: [],
      }),
    };

    const useCase = new RegisterInstallmentReceiptUseCase(
      authorizationService as never,
      incomeReceiptRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idIncome: "income-1",
      idIncomeInstallment: "inst-1",
      amountReceived: 100,
    });

    expect(result.incomeStatus).toBe(IncomeStatus.PARTIALLY_RECEIVED);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(
      incomeReceiptRepository.registerInstallmentReceipt,
    ).toHaveBeenCalledWith("user-1", {
      idIncome: "income-1",
      idIncomeInstallment: "inst-1",
      amountReceived: 100,
    });
  });

  it("rejects a non-positive receipt amount before hitting the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };
    const incomeReceiptRepository = {
      registerInstallmentReceipt: jest.fn(),
    };

    const useCase = new RegisterInstallmentReceiptUseCase(
      authorizationService as never,
      incomeReceiptRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idIncome: "income-1",
        idIncomeInstallment: "inst-1",
        amountReceived: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(
      incomeReceiptRepository.registerInstallmentReceipt,
    ).not.toHaveBeenCalled();
  });
});
