import { ForbiddenException } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

describe("CreateDebtUseCase", () => {
  it("should create debt with valid payload", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      create: jest.fn().mockResolvedValue({
        idDebt: "debt-1",
        idUsers: "user-1",
        idAccount: "account-1",
        idCategory: "category-1",
        title: "Cartao de credito",
        category: "Cartao",
        debtType: DebtType.FIXED,
        totalAmount: 1200,
        dueDate: new Date("2026-07-01"),
        startDate: new Date("2026-07-01"),
        hasInstallments: true,
        installmentCount: 12,
        status: DebtStatus.OPEN,
        settledAt: undefined,
        installments: [],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const useCase = new CreateDebtUseCase(
      authorizationService as never,
      {
        listByUser: jest
          .fn()
          .mockResolvedValue([{ idAccount: "account-1", isActive: true }]),
      } as never,
      debtRepository as never,
      {
        findById: jest.fn().mockResolvedValue({
          idCategory: "category-1",
          status: true,
          name: "Cartao",
        }),
      } as never,
    );

    const result = await useCase.execute("user-1", {
      title: "Cartao de credito",
      idCategory: "category-1",
      debtType: DebtType.FIXED,
      totalAmount: 1200,
      dueDate: new Date("2026-07-01"),
      hasInstallments: true,
      installmentCount: 12,
    });

    expect(result.idDebt).toBe("debt-1");
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_DEBTS,
    );
    expect(debtRepository.create).toHaveBeenCalledTimes(1);
    expect(debtRepository.create.mock.calls[0]?.[1]).toHaveLength(12);
  });

  it("should reject creation without permission", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest
        .fn()
        .mockRejectedValue(new ForbiddenException("Sem permissao")),
    };

    const debtRepository = {
      create: jest.fn(),
    };

    const useCase = new CreateDebtUseCase(
      authorizationService as never,
      {
        listByUser: jest
          .fn()
          .mockResolvedValue([{ idAccount: "account-1", isActive: true }]),
      } as never,
      debtRepository as never,
      {
        findById: jest.fn().mockResolvedValue({
          idCategory: "category-1",
          status: true,
          name: "Geral",
        }),
      } as never,
    );

    await expect(
      useCase.execute("user-1", {
        title: "Conta variavel",
        idCategory: "category-1",
        debtType: DebtType.VARIABLE,
        totalAmount: 300,
        dueDate: new Date("2026-07-01"),
        hasInstallments: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(debtRepository.create).not.toHaveBeenCalled();
  });
});
