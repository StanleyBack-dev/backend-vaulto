import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DeleteDebtPaymentUseCase } from "@/modules/payments/application/use-cases/delete-debt-payment.use-case";

describe("DeleteDebtPaymentUseCase", () => {
  it("deletes a payment after checking permission", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const paymentRepository = {
      deletePayment: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        debtStatus: DebtStatus.OPEN,
        payments: [],
        installments: [],
      }),
    };

    const useCase = new DeleteDebtPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    const result = await useCase.execute("user-1", "payment-1");

    expect(result.debtStatus).toBe(DebtStatus.OPEN);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(paymentRepository.deletePayment).toHaveBeenCalledWith(
      "user-1",
      "payment-1",
    );
  });

  it("propagates a permission rejection without calling the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest
        .fn()
        .mockRejectedValue(new Error("Sem permissao")),
    };

    const paymentRepository = {
      deletePayment: jest.fn(),
    };

    const useCase = new DeleteDebtPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    await expect(useCase.execute("user-1", "payment-1")).rejects.toThrow(
      "Sem permissao",
    );

    expect(paymentRepository.deletePayment).not.toHaveBeenCalled();
  });
});
