import { Test } from "@nestjs/testing";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { PaymentAllocationService } from "@/modules/payments/domain/services/payment-allocation.service";
import { ListDebtPaymentsUseCase } from "@/modules/payments/application/use-cases/list-debt-payments.use-case";
import { RegisterInstallmentPaymentUseCase } from "@/modules/payments/application/use-cases/register-installment-payment.use-case";
import { UpdateDebtPaymentUseCase } from "@/modules/payments/application/use-cases/update-debt-payment.use-case";
import { DeleteDebtPaymentUseCase } from "@/modules/payments/application/use-cases/delete-debt-payment.use-case";
import {
  PAYMENT_REPOSITORY,
  type DebtPaymentView,
  type PaymentInstallmentView,
  type PaymentRepositoryPort,
  type RegisterInstallmentPaymentCommand,
  type RegisterInstallmentPaymentResult,
  type UpdateDebtPaymentCommand,
} from "@/modules/payments/application/ports/payment-repository.port";
import { PaymentsResolver } from "@/modules/payments/presentation/graphql/resolvers/payments.resolver";

class InMemoryPaymentRepository implements PaymentRepositoryPort {
  private installments: PaymentInstallmentView[] = [
    {
      idDebtInstallment: "inst-1",
      idDebt: "debt-1",
      installmentNumber: 1,
      amountDue: 100,
      amountPaid: 0,
      dueDate: new Date("2026-07-01"),
      status: DebtStatus.OPEN,
    },
    {
      idDebtInstallment: "inst-2",
      idDebt: "debt-1",
      installmentNumber: 2,
      amountDue: 100,
      amountPaid: 0,
      dueDate: new Date("2026-08-01"),
      status: DebtStatus.OPEN,
    },
  ];

  private payments: DebtPaymentView[] = [];

  async registerInstallmentPayment(
    idUsers: string,
    command: RegisterInstallmentPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult> {
    const allocation = PaymentAllocationService.allocate(
      this.installments,
      command.amountPaid,
      command.idDebtInstallment,
    );

    const paidAt = command.paidAt ?? new Date();
    const created: DebtPaymentView[] = [];

    for (const line of allocation.lines) {
      const installment = this.installments.find(
        (item) => item.idDebtInstallment === line.idDebtInstallment,
      );
      if (!installment) continue;

      installment.amountPaid = line.resultingAmountPaid;
      installment.status = line.resultingStatus;
      if (line.fullyPaidByThisAllocation) {
        installment.paidAt = paidAt;
      }

      const payment: DebtPaymentView = {
        idDebtPayment: `payment-${this.payments.length + created.length + 1}`,
        idDebt: command.idDebt,
        idDebtInstallment: line.idDebtInstallment,
        idUsers,
        amountPaid: line.amountApplied,
        paidAt,
        createdAt: new Date(),
      };
      created.push(payment);
    }

    this.payments.unshift(...created);

    const debtStatus = this.installments.every(
      (installment) => installment.status === DebtStatus.PAID,
    )
      ? DebtStatus.PAID
      : DebtStatus.PARTIALLY_PAID;

    return {
      idDebt: command.idDebt,
      debtStatus,
      payments: created,
      installments: this.installments,
    };
  }

  async listPaymentsForDebt(): Promise<DebtPaymentView[]> {
    return this.payments;
  }

  async updatePayment(
    _idUsers: string,
    command: UpdateDebtPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult> {
    const payment = this.payments.find(
      (item) => item.idDebtPayment === command.idDebtPayment,
    );
    if (!payment) {
      throw new Error("payment not found");
    }
    if (command.amountPaid !== undefined) {
      payment.amountPaid = command.amountPaid;
    }
    if (command.paidAt !== undefined) {
      payment.paidAt = command.paidAt;
    }

    return this.recompute(payment.idDebt);
  }

  async deletePayment(
    _idUsers: string,
    idDebtPayment: string,
  ): Promise<RegisterInstallmentPaymentResult> {
    const payment = this.payments.find(
      (item) => item.idDebtPayment === idDebtPayment,
    );
    if (!payment) {
      throw new Error("payment not found");
    }
    this.payments = this.payments.filter(
      (item) => item.idDebtPayment !== idDebtPayment,
    );

    return this.recompute(payment.idDebt);
  }

  private async recompute(
    idDebt: string,
  ): Promise<RegisterInstallmentPaymentResult> {
    for (const installment of this.installments) {
      const ledgerRows = this.payments.filter(
        (item) => item.idDebtInstallment === installment.idDebtInstallment,
      );
      const total = ledgerRows.reduce((sum, row) => sum + row.amountPaid, 0);
      installment.amountPaid = total;
      installment.status =
        total <= 0
          ? DebtStatus.OPEN
          : total >= installment.amountDue
            ? DebtStatus.PAID
            : DebtStatus.PARTIALLY_PAID;
    }

    const debtStatus = this.installments.every(
      (installment) => installment.status === DebtStatus.PAID,
    )
      ? DebtStatus.PAID
      : this.installments.some(
            (installment) => installment.status === DebtStatus.PARTIALLY_PAID,
          )
        ? DebtStatus.PARTIALLY_PAID
        : DebtStatus.OPEN;

    return {
      idDebt,
      debtStatus,
      payments: this.payments.filter((item) => item.idDebt === idDebt),
      installments: this.installments,
    };
  }
}

describe("Payments GraphQL flow (register installment payment)", () => {
  it("cascades an overpayment onto the next installment and records both payment lines", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsResolver,
        RegisterInstallmentPaymentUseCase,
        ListDebtPaymentsUseCase,
        UpdateDebtPaymentUseCase,
        DeleteDebtPaymentUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PAYMENT_REPOSITORY,
          useValue: new InMemoryPaymentRepository(),
        },
      ],
    }).compile();

    const resolver = moduleRef.get(PaymentsResolver);
    const user = {
      idUsers: "user-1",
      username: "john",
      group: "USER" as never,
    };

    const result = await resolver.registerInstallmentPayment(user, {
      idDebt: "debt-1",
      idDebtInstallment: "inst-1",
      amountPaid: 150,
    });

    expect(result.data.debtStatus).toBe(DebtStatus.PARTIALLY_PAID);
    expect(result.data.payments).toHaveLength(2);
    expect(result.data.payments[0]).toMatchObject({
      idDebtInstallment: "inst-1",
      amountPaid: 100,
    });
    expect(result.data.payments[1]).toMatchObject({
      idDebtInstallment: "inst-2",
      amountPaid: 50,
    });

    const installmentOne = result.data.installments.find(
      (installment) => installment.idDebtInstallment === "inst-1",
    );
    const installmentTwo = result.data.installments.find(
      (installment) => installment.idDebtInstallment === "inst-2",
    );

    expect(installmentOne?.status).toBe(DebtStatus.PAID);
    expect(installmentTwo?.status).toBe(DebtStatus.PARTIALLY_PAID);
    expect(installmentTwo?.amountPaid).toBe(50);

    const history = await resolver.getDebtPayments(user, "debt-1");
    expect(history).toHaveLength(2);
  });
});
