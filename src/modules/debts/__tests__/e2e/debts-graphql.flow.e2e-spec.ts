import { Test } from "@nestjs/testing";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { CATEGORY_REPOSITORY } from "@/modules/categories/application/ports/category-repository.port";
import { CREDIT_CARD_REPOSITORY } from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { DebtsResolver } from "@/modules/debts/presentation/graphql/resolvers/debts.resolver";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { DeleteDebtUseCase } from "@/modules/debts/application/use-cases/delete/delete-debt.use-case";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { UpdateDebtDetailsUseCase } from "@/modules/debts/application/use-cases/update/update-debt-details.use-case";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import {
  DEBT_REPOSITORY,
  type CreateDebtInstallmentPayload,
  type CreateDebtPayload,
  type DebtRepositoryPort,
  type DebtView,
  type ListDebtsFilters,
  type UpdateDebtDetailsPayload,
  type UpdateDebtStatusPayload,
} from "@/modules/debts/application/ports/debt-repository.port";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtType } from "@/modules/debts/domain/enums/debt-type.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { AppException } from "@/common/exceptions/app-exception";

class InMemoryDebtRepository implements DebtRepositoryPort {
  private debts: DebtView[] = [];

  async create(
    payload: CreateDebtPayload,
    installments: CreateDebtInstallmentPayload[],
  ): Promise<DebtView> {
    const debt: DebtView = {
      idDebt: `debt-${this.debts.length + 1}`,
      idUsers: payload.idUsers,
      idCategory: payload.idCategory,
      title: payload.title,
      category: payload.category,
      description: payload.description,
      debtType: payload.debtType,
      totalAmount: payload.totalAmount,
      dueDate: payload.dueDate,
      startDate: payload.startDate,
      hasInstallments: payload.hasInstallments,
      installmentCount: payload.installmentCount ?? 1,
      status: payload.status,
      settledAt: undefined,
      installments: installments.map((installment, idx) => ({
        idDebtInstallment: `inst-${this.debts.length + 1}-${idx + 1}`,
        idDebt: `debt-${this.debts.length + 1}`,
        installmentNumber: installment.installmentNumber,
        amountDue: installment.amountDue,
        amountPaid: installment.amountPaid ?? 0,
        dueDate: installment.dueDate,
        paidAt: installment.paidAt,
        status: installment.status,
      })),
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.debts.push(debt);
    return debt;
  }

  async listByUser(
    idUsers: string,
    filters?: ListDebtsFilters,
  ): Promise<{ records: DebtView[]; total: number }> {
    let records = this.debts.filter((debt) => debt.idUsers === idUsers);

    if (filters?.status) {
      records = records.filter((debt) => debt.status === filters.status);
    }

    if (filters?.debtType) {
      records = records.filter((debt) => debt.debtType === filters.debtType);
    }

    return { records, total: records.length };
  }

  async findById(idUsers: string, idDebt: string): Promise<DebtView> {
    const debt = this.debts.find(
      (item) => item.idDebt === idDebt && item.idUsers === idUsers,
    );

    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    return debt;
  }

  async updateStatus(
    idUsers: string,
    payload: UpdateDebtStatusPayload,
  ): Promise<DebtView> {
    const debt = this.debts.find(
      (item) => item.idDebt === payload.idDebt && item.idUsers === idUsers,
    );

    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    debt.status = payload.status;
    debt.updatedAt = new Date();
    return debt;
  }

  async updateDetails(
    idUsers: string,
    payload: UpdateDebtDetailsPayload,
  ): Promise<DebtView> {
    const debt = this.debts.find(
      (item) => item.idDebt === payload.idDebt && item.idUsers === idUsers,
    );

    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    if (payload.title !== undefined) debt.title = payload.title;
    if (payload.idCategory !== undefined) debt.idCategory = payload.idCategory;
    if (payload.category !== undefined) debt.category = payload.category;
    if (payload.debtType !== undefined) debt.debtType = payload.debtType;
    if (payload.acquiredAt !== undefined) debt.acquiredAt = payload.acquiredAt;

    debt.updatedAt = new Date();
    return debt;
  }

  async delete(idUsers: string, idDebt: string): Promise<void> {
    const debt = this.debts.find(
      (item) => item.idDebt === idDebt && item.idUsers === idUsers,
    );

    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    this.debts = this.debts.filter((item) => item.idDebt !== idDebt);
  }
}

describe("Debts GraphQL flow (create/list/update status)", () => {
  it("should create debt, list debts, read details and update status", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DebtsResolver,
        CreateDebtUseCase,
        GetDebtByIdUseCase,
        ListDebtsUseCase,
        UpdateDebtDetailsUseCase,
        UpdateDebtStatusUseCase,
        DeleteDebtUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CATEGORY_REPOSITORY,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              idCategory: "category-1",
              status: true,
              name: "Cartao",
            }),
          },
        },
        {
          provide: CREDIT_CARD_REPOSITORY,
          useValue: {
            findById: jest.fn().mockResolvedValue(null),
            findByName: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: DEBT_REPOSITORY,
          useClass: InMemoryDebtRepository,
        },
        {
          provide: PlanLimitsService,
          useValue: {
            assertCanCreate: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    const resolver = moduleRef.get(DebtsResolver);
    const user = {
      idUsers: "user-1",
      username: "john",
      group: "USER" as never,
    };

    const created = await resolver.createDebt(user, {
      title: "Cartao principal",
      idCategory: "category-1",
      description: "Fatura do cartao",
      debtType: DebtType.FIXED,
      totalAmount: 300,
      dueDate: new Date("2026-07-01"),
      hasInstallments: true,
      installmentCount: 3,
    });

    expect(created.data.installments).toHaveLength(3);

    const list = await resolver.getMyDebts(user, { page: 1, limit: 10 });
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.status).toBe(DebtStatus.OPEN);

    const detail = await resolver.getDebtById(user, {
      idDebt: created.data.idDebt,
    });

    expect(detail.installments).toHaveLength(3);

    const updated = await resolver.updateDebtStatus(user, {
      idDebt: created.data.idDebt,
      status: DebtStatus.OVERDUE,
    });

    expect(updated.data.status).toBe(DebtStatus.OVERDUE);

    const deleted = await resolver.deleteDebt(user, created.data.idDebt);
    expect(deleted.success).toBe(true);

    const listAfterDelete = await resolver.getMyDebts(user, {
      page: 1,
      limit: 10,
    });
    expect(listAfterDelete.items).toHaveLength(0);

    await expect(
      resolver.getDebtById(user, { idDebt: created.data.idDebt }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
