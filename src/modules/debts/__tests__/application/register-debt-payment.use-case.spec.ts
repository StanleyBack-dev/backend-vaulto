import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RegisterDebtPaymentUseCase } from "@/modules/debts/application/use-cases/payment/register-debt-payment.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

describe("RegisterDebtPaymentUseCase", () => {
  it("should register payment for debt", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      registerPayment: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        idUsers: "user-1",
        title: "Cartao",
        debtType: DebtType.FIXED,
        totalAmount: 1200,
        startDate: new Date("2026-07-01"),
        hasInstallments: true,
        installmentCount: 12,
        status: DebtStatus.PARTIALLY_PAID,
        settledAt: undefined,
        installments: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const useCase = new RegisterDebtPaymentUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idDebt: "debt-1",
      amountPaid: 100,
    });

    expect(result.status).toBe(DebtStatus.PARTIALLY_PAID);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(debtRepository.registerPayment).toHaveBeenCalledWith("user-1", {
      idDebt: "debt-1",
      amountPaid: 100,
      paidAt: undefined,
    });
  });
});

