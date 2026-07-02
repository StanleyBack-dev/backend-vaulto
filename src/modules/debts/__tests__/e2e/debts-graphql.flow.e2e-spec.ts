import { Test } from "@nestjs/testing";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { ACCOUNT_REPOSITORY } from "@/modules/accounts/application/ports/account-repository.port";
import { DebtsResolver } from "@/modules/debts/presentation/graphql/resolvers/debts.resolver";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { RegisterDebtPaymentUseCase } from "@/modules/debts/application/use-cases/payment/register-debt-payment.use-case";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import {
  DEBT_REPOSITORY,
  type CreateDebtInstallmentPayload,
  type CreateDebtPayload,
  type DebtRepositoryPort,
  type DebtView,
  type ListDebtsFilters,
  type RegisterDebtPaymentPayload,
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
      idAccount: payload.idAccount,
      title: payload.title,
      description: payload.description,
      debtType: payload.debtType,
      totalAmount: payload.totalAmount,
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

  async registerPayment(
    idUsers: string,
    payload: RegisterDebtPaymentPayload,
  ): Promise<DebtView> {
    const debt = this.debts.find(
      (item) => item.idDebt === payload.idDebt && item.idUsers === idUsers,
    );

    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    let remaining = payload.amountPaid;

    debt.payments.unshift({
      idDebtPayment: `payment-${debt.payments.length + 1}`,
      idDebt: debt.idDebt,
      idUsers,
      amountPaid: payload.amountPaid,
      paidAt: payload.paidAt ?? new Date(),
      createdAt: new Date(),
    });

    for (const installment of debt.installments) {
      if (remaining <= 0) {
        break;
      }

      const outstanding = installment.amountDue - installment.amountPaid;
      if (outstanding <= 0) {
        continue;
      }

      const applied = Math.min(remaining, outstanding);
      installment.amountPaid = Number((installment.amountPaid + applied).toFixed(2));
      remaining = Number((remaining - applied).toFixed(2));

      installment.status =
        installment.amountPaid >= installment.amountDue
          ? DebtStatus.PAID
          : DebtStatus.PARTIALLY_PAID;
    }

    if (debt.installments.every((installment) => installment.status === DebtStatus.PAID)) {
      debt.status = DebtStatus.PAID;
      debt.settledAt = payload.paidAt ?? new Date();
    } else {
      debt.status = DebtStatus.PARTIALLY_PAID;
      debt.settledAt = undefined;
    }

    debt.updatedAt = new Date();
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
}

describe("Debts GraphQL flow (create/list/pay)", () => {
  it("should create debt, list debts and register payment", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DebtsResolver,
        CreateDebtUseCase,
        GetDebtByIdUseCase,
        ListDebtsUseCase,
        RegisterDebtPaymentUseCase,
        UpdateDebtStatusUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: {
            findByIdAndUser: jest.fn().mockResolvedValue({ idAccount: "account-1" }),
          },
        },
        {
          provide: DEBT_REPOSITORY,
          useClass: InMemoryDebtRepository,
        },
      ],
    }).compile();

    const resolver = moduleRef.get(DebtsResolver);
    const user = { idUsers: "user-1", username: "john", group: "USER" as never };

    const created = await resolver.createDebt(user, {
      idAccount: "account-1",
      title: "Cartao principal",
      description: "Fatura do cartao",
      debtType: DebtType.FIXED,
      totalAmount: 300,
      startDate: new Date("2026-07-01"),
      hasInstallments: true,
      installmentCount: 3,
    });

    expect(created.data.installments).toHaveLength(3);

    const list = await resolver.getMyDebts(user, { page: 1, limit: 10 });
    expect(list.items).toHaveLength(1);
    expect(list.items[0]?.status).toBe(DebtStatus.OPEN);

    const paid = await resolver.registerDebtPayment(user, {
      idDebt: created.data.idDebt,
      amountPaid: 100,
    });

    expect(paid.data.status).toBe(DebtStatus.PARTIALLY_PAID);

    const detail = await resolver.getDebtById(user, {
      idDebt: created.data.idDebt,
    });

    expect(detail.payments).toHaveLength(1);

    const updated = await resolver.updateDebtStatus(user, {
      idDebt: created.data.idDebt,
      status: DebtStatus.OVERDUE,
    });

    expect(updated.data.status).toBe(DebtStatus.OVERDUE);
  });
});


