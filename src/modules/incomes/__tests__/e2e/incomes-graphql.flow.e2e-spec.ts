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

  async create(payload: CreateIncomePayload): Promise<IncomeView> {
    const income: IncomeView = {
      idIncome: `income-${this.incomes.length + 1}`,
      idUsers: payload.idUsers,
      idCategory: payload.idCategory,
      category: payload.category,
      title: payload.title,
      description: payload.description,
      incomeType: payload.incomeType,
      expectedAmount: payload.expectedAmount,
      expectedDate: payload.expectedDate,
      receivedAmount: payload.receivedAmount,
      receivedAt: payload.receivedAt,
      isRecurring: payload.isRecurring,
      status: payload.status,
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

    if (payload.receivedAmount !== undefined) {
      income.receivedAmount = payload.receivedAmount;

      if (income.receivedAmount <= 0) {
        income.status = IncomeStatus.PENDING;
      } else if (income.receivedAmount >= income.expectedAmount) {
        income.status = IncomeStatus.RECEIVED;
      } else {
        income.status = IncomeStatus.PARTIALLY_RECEIVED;
      }
    }

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

describe("Incomes GraphQL flow (create/list/receive/delete)", () => {
  it("should create income, list, register a partial receipt and delete it", async () => {
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
      expectedAmount: 1000,
      expectedDate: new Date("2026-08-05"),
    });

    expect(created.data.status).toBe(IncomeStatus.PENDING);

    const list = await resolver.getMyIncomes(user, { page: 1, limit: 10 });
    expect(list.items).toHaveLength(1);

    const partiallyReceived = await resolver.updateIncomeDetails(user, {
      idIncome: created.data.idIncome,
      receivedAmount: 400,
    });
    expect(partiallyReceived.data.status).toBe(IncomeStatus.PARTIALLY_RECEIVED);

    const fullyReceived = await resolver.updateIncomeDetails(user, {
      idIncome: created.data.idIncome,
      receivedAmount: 1000,
    });
    expect(fullyReceived.data.status).toBe(IncomeStatus.RECEIVED);

    const deleted = await resolver.deleteIncome(user, created.data.idIncome);
    expect(deleted.success).toBe(true);

    const listAfterDelete = await resolver.getMyIncomes(user, {
      page: 1,
      limit: 10,
    });
    expect(listAfterDelete.items).toHaveLength(0);
  });
});
