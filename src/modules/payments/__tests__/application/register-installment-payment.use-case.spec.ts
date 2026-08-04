import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { RegisterInstallmentPaymentUseCase } from "@/modules/payments/application/use-cases/register-installment-payment.use-case";
import { AppException } from "@/common/exceptions/app-exception";

describe("RegisterInstallmentPaymentUseCase", () => {
  it("registers a payment for the chosen installment", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const paymentRepository = {
      registerInstallmentPayment: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        debtStatus: DebtStatus.PARTIALLY_PAID,
        payments: [],
        installments: [],
      }),
    };

    const useCase = new RegisterInstallmentPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idDebt: "debt-1",
      idDebtInstallment: "inst-1",
      amountPaid: 100,
    });

    expect(result.debtStatus).toBe(DebtStatus.PARTIALLY_PAID);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(paymentRepository.registerInstallmentPayment).toHaveBeenCalledWith(
      "user-1",
      {
        idDebt: "debt-1",
        idDebtInstallment: "inst-1",
        amountPaid: 100,
      },
    );
  });

  it("rejects a non-positive payment amount before hitting the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };
    const paymentRepository = {
      registerInstallmentPayment: jest.fn(),
    };

    const useCase = new RegisterInstallmentPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idDebt: "debt-1",
        idDebtInstallment: "inst-1",
        amountPaid: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(paymentRepository.registerInstallmentPayment).not.toHaveBeenCalled();
  });
});
