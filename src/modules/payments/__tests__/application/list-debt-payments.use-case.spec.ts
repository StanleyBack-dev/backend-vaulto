import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ListDebtPaymentsUseCase } from "@/modules/payments/application/use-cases/list-debt-payments.use-case";

describe("ListDebtPaymentsUseCase", () => {
  it("lists payments for a debt after checking read permission", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const payments = [
      {
        idDebtPayment: "payment-1",
        idDebt: "debt-1",
        idUsers: "user-1",
        amountPaid: 100,
        paidAt: new Date("2026-07-01"),
        createdAt: new Date("2026-07-01"),
      },
    ];

    const paymentRepository = {
      listPaymentsForDebt: jest.fn().mockResolvedValue(payments),
    };

    const useCase = new ListDebtPaymentsUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    const result = await useCase.execute("user-1", "debt-1");

    expect(result).toBe(payments);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(paymentRepository.listPaymentsForDebt).toHaveBeenCalledWith(
      "user-1",
      "debt-1",
    );
  });

  it("propagates a permission rejection without calling the repository", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest
        .fn()
        .mockRejectedValue(new Error("Sem permissao")),
    };

    const paymentRepository = {
      listPaymentsForDebt: jest.fn(),
    };

    const useCase = new ListDebtPaymentsUseCase(
      authorizationService as never,
      paymentRepository as never,
    );

    await expect(useCase.execute("user-1", "debt-1")).rejects.toThrow(
      "Sem permissao",
    );

    expect(paymentRepository.listPaymentsForDebt).not.toHaveBeenCalled();
  });
});
