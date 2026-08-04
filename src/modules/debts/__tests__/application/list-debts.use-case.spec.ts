import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";

describe("ListDebtsUseCase", () => {
  it("should return paginated debts", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const debtRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [
          {
            idDebt: "debt-1",
            idUsers: "user-1",
            idAccount: "account-1",
            idCategory: "category-1",
            title: "Cartao",
            category: "Cartao",
            description: "Fatura principal",
            debtType: DebtType.FIXED,
            totalAmount: 999.9,
            dueDate: new Date("2026-07-01"),
            startDate: new Date("2026-07-01"),
            hasInstallments: true,
            installmentCount: 10,
            status: DebtStatus.OPEN,
            settledAt: undefined,
            installments: [],
            payments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      }),
    };

    const useCase = new ListDebtsUseCase(
      authorizationService as never,
      debtRepository as never,
    );

    const result = await useCase.execute("user-1", { page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(debtRepository.listByUser).toHaveBeenCalledWith("user-1", {
      page: 1,
      limit: 10,
    });
  });
});
