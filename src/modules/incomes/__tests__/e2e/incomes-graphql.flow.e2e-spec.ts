import { Test } from "@nestjs/testing";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { CATEGORY_REPOSITORY } from "@/modules/categories/application/ports/category-repository.port";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { CreateIncomeUseCase } from "@/modules/incomes/application/use-cases/create/create-income.use-case";
import { DeleteIncomeUseCase } from "@/modules/incomes/application/use-cases/delete/delete-income.use-case";
import { GetIncomeByIdUseCase } from "@/modules/incomes/application/use-cases/get/get-income-by-id.use-case";
import { ListIncomesUseCase } from "@/modules/incomes/application/use-cases/get/list-incomes.use-case";
import { UpdateIncomeDetailsUseCase } from "@/modules/incomes/application/use-cases/update/update-income-details.use-case";
import { UpdateIncomeStatusUseCase } from "@/modules/incomes/application/use-cases/update/update-income-status.use-case";
import {
  INCOME_REPOSITORY,
  type CreateIncomeInstallmentPayload,
  type CreateIncomePayload,
  type IncomeRepositoryPort,
  type IncomeView,
  type ListIncomesFilters,
  type UpdateIncomeDetailsPayload,
  type UpdateIncomeStatusPayload,
} from "@/modules/incomes/application/ports/income-repository.port";
import { IncomesResolver } from "@/modules/incomes/presentation/graphql/resolvers/incomes.resolver";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeType } from "@/modules/incomes/domain/enums/income-type.enum";

class InMemoryIncomeRepository implements IncomeRepositoryPort {
  private incomes: IncomeView[] = [];

  async create(
    payload: CreateIncomePayload,
    installments: CreateIncomeInstallmentPayload[],
  ): Promise<IncomeView> {
    const idIncome = `income-${this.incomes.length + 1}`;
    const income: IncomeView = {
      idIncome,
      idUsers: payload.idUsers,
      idCategory: payload.idCategory,
      category: payload.category,
      title: payload.title,
      description: payload.description,
      incomeType: payload.incomeType,
      totalAmount: payload.totalAmount,
      dueDate: payload.dueDate,
      startDate: payload.startDate,
      hasInstallments: payload.hasInstallments,
      installmentCount: payload.installmentCount,
      isRecurring: payload.isRecurring,
      status: payload.status,
      installments: installments.map((installment, idx) => ({
        idIncomeInstallment: `inst-${idIncome}-${idx + 1}`,
        idIncome,
        installmentNumber: installment.installmentNumber,
        amountDue: installment.amountDue,
        amountReceived: installment.amountReceived ?? 0,
        dueDate: installment.dueDate,
        receivedAt: installment.receivedAt,
        status: installment.status,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.incomes.push(income);
    return income;
  }

  async listByUser(
    idUsers: string,
    filters?: ListIncomesFilters,
  ): Promise<{ records: IncomeView[]; total: number }> {
    let records = this.incomes.filter((income) => income.idUsers === idUsers);

    if (filters?.status) {
      records = records.filter((income) => income.status === filters.status);
    }

    return { records, total: records.length };
  }

  async findById(idUsers: string, idIncome: string): Promise<IncomeView> {
    const income = this.incomes.find(
      (item) => item.idIncome === idIncome && item.idUsers === idUsers,
    );

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    return income;
  }

  async updateDetails(
    idUsers: string,
    payload: UpdateIncomeDetailsPayload,
  ): Promise<IncomeView> {
    const income = this.incomes.find(
      (item) => item.idIncome === payload.idIncome && item.idUsers === idUsers,
    );

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    if (payload.title !== undefined) income.title = payload.title;
    if (payload.description !== undefined)
      income.description = payload.description;
    if (payload.idCategory !== undefined)
      income.idCategory = payload.idCategory;
    if (payload.category !== undefined) income.category = payload.category;
    if (payload.incomeType !== undefined)
      income.incomeType = payload.incomeType;
    if (payload.isRecurring !== undefined)
      income.isRecurring = payload.isRecurring;

    income.updatedAt = new Date();
    return income;
  }

  async updateStatus(
    idUsers: string,
    payload: UpdateIncomeStatusPayload,
  ): Promise<IncomeView> {
    const income = this.incomes.find(
      (item) => item.idIncome === payload.idIncome && item.idUsers === idUsers,
    );

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    income.status = payload.status;
    income.updatedAt = new Date();
    return income;
  }

  async delete(idUsers: string, idIncome: string): Promise<void> {
    const income = this.incomes.find(
      (item) => item.idIncome === idIncome && item.idUsers === idUsers,
    );

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    this.incomes = this.incomes.filter((item) => item.idIncome !== idIncome);
  }
}

describe("Incomes GraphQL flow (create/list/update status/delete)", () => {
  it("should create income with installments, list, read details and update status", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        IncomesResolver,
        CreateIncomeUseCase,
        GetIncomeByIdUseCase,
        ListIncomesUseCase,
        UpdateIncomeDetailsUseCase,
        UpdateIncomeStatusUseCase,
        DeleteIncomeUseCase,
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
              type: CategoryType.INCOME,
              name: "Freelance",
            }),
          },
        },
        {
          provide: INCOME_REPOSITORY,
          useClass: InMemoryIncomeRepository,
        },
      ],
    }).compile();

    const resolver = moduleRef.get(IncomesResolver);
    const user = {
      idUsers: "user-1",
      username: "john",
      group: "USER" as never,
    };

    const created = await resolver.createIncome(user, {
      title: "Projeto site",
      idCategory: "category-1",
      incomeType: IncomeType.VARIABLE,
      totalAmount: 1000,
      dueDate: new Date("2026-08-05"),
      hasInstallments: true,
      installmentCount: 4,
    });

    expect(created.data.status).toBe(IncomeStatus.PENDING);
    expect(created.data.installments).toHaveLength(4);

    const list = await resolver.getMyIncomes(user, { page: 1, limit: 10 });
    expect(list.items).toHaveLength(1);

    const detail = await resolver.getIncomeById(user, {
      idIncome: created.data.idIncome,
    });
    expect(detail.installments).toHaveLength(4);

    const updated = await resolver.updateIncomeStatus(user, {
      idIncome: created.data.idIncome,
      status: IncomeStatus.OVERDUE,
    });
    expect(updated.data.status).toBe(IncomeStatus.OVERDUE);

    const deleted = await resolver.deleteIncome(user, created.data.idIncome);
    expect(deleted.success).toBe(true);

    const listAfterDelete = await resolver.getMyIncomes(user, {
      page: 1,
      limit: 10,
    });
    expect(listAfterDelete.items).toHaveLength(0);
  });
});
