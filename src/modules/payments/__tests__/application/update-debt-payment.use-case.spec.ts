import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { UpdateDebtPaymentUseCase } from "@/modules/payments/application/use-cases/update-debt-payment.use-case";
import { AppException } from "@/common/exceptions/app-exception";

describe("UpdateDebtPaymentUseCase", () => {
  it("updates a payment with a valid amount", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const paymentRepository = {
      updatePayment: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        debtStatus: DebtStatus.PARTIALLY_PAID,
        payments: [],
        installments: [],
      }),
    };

    const useCase = new UpdateDebtPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    const result = await useCase.execute("user-1", {
      idDebtPayment: "payment-1",
      amountPaid: 150,
    });

    expect(result.debtStatus).toBe(DebtStatus.PARTIALLY_PAID);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(paymentRepository.updatePayment).toHaveBeenCalledWith("user-1", {
      idDebtPayment: "payment-1",
      amountPaid: 150,
    });
  });

  it("allows updating only paidAt, leaving amountPaid untouched", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const paymentRepository = {
      updatePayment: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        debtStatus: DebtStatus.PAID,
        payments: [],
        installments: [],
      }),
    };

    const useCase = new UpdateDebtPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    const paidAt = new Date("2026-07-01");
    await useCase.execute("user-1", {
      idDebtPayment: "payment-1",
      paidAt,
    });

    expect(paymentRepository.updatePayment).toHaveBeenCalledWith("user-1", {
      idDebtPayment: "payment-1",
      paidAt,
    });
  });

  it("rejects a non-positive payment amount before hitting the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };
    const paymentRepository = {
      updatePayment: jest.fn(),
    };

    const useCase = new UpdateDebtPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idDebtPayment: "payment-1",
        amountPaid: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(paymentRepository.updatePayment).not.toHaveBeenCalled();
  });

  it("rejects a non-finite payment amount before hitting the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };
    const paymentRepository = {
      updatePayment: jest.fn(),
    };

    const useCase = new UpdateDebtPaymentUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    await expect(
      useCase.execute("user-1", {
        idDebtPayment: "payment-1",
        amountPaid: Number.NaN,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(paymentRepository.updatePayment).not.toHaveBeenCalled();
  });
});
