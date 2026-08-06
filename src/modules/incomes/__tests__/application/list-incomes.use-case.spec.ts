import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { ListIncomesUseCase } from "@/modules/incomes/application/use-cases/get/list-incomes.use-case";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

describe("ListIncomesUseCase", () => {
  it("should return paginated incomes", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({
        records: [
          {
            idIncome: "income-1",
            idUsers: "user-1",
            idCategory: "category-1",
            category: "Freelance",
            title: "Projeto site",
            incomeType: IncomeType.VARIABLE,
            totalAmount: 1000,
            startDate: new Date("2026-08-05"),
            hasInstallments: false,
            installmentCount: 1,
            isRecurring: false,
            status: IncomeStatus.PENDING,
            installments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
      }),
    };

    const useCase = new ListIncomesUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    const result = await useCase.execute("user-1", { page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.READ_OWN_DEBTS,
    );
    expect(incomeRepository.listByUser).toHaveBeenCalledWith("user-1", {
      page: 1,
      limit: 10,
    });
  });

  it("should resolve default pagination when no query is provided", async () => {
    const authorizationService = {
      assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
    };

    const incomeRepository = {
      listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
    };

    const useCase = new ListIncomesUseCase(
      authorizationService as never,
      incomeRepository as never,
    );

    const result = await useCase.execute("user-1");

    expect(result.items).toHaveLength(0);
    expect(incomeRepository.listByUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        page: expect.any(Number),
        limit: expect.any(Number),
      }),
    );
  });
});
