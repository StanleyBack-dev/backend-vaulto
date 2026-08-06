import { Test } from "@nestjs/testing";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { ReceiptAllocationService } from "@/modules/income-receipts/domain/services/receipt-allocation.service";
import { ListIncomeReceiptsUseCase } from "@/modules/income-receipts/application/use-cases/list-income-receipts.use-case";
import { RegisterInstallmentReceiptUseCase } from "@/modules/income-receipts/application/use-cases/register-installment-receipt.use-case";
import { UpdateIncomeReceiptUseCase } from "@/modules/income-receipts/application/use-cases/update-income-receipt.use-case";
import { DeleteIncomeReceiptUseCase } from "@/modules/income-receipts/application/use-cases/delete-income-receipt.use-case";
import {
  INCOME_RECEIPT_REPOSITORY,
  type IncomeReceiptRepositoryPort,
  type IncomeReceiptView,
  type ReceiptInstallmentView,
  type RegisterInstallmentReceiptCommand,
  type RegisterInstallmentReceiptResult,
  type UpdateIncomeReceiptCommand,
} from "@/modules/income-receipts/application/ports/income-receipt-repository.port";
import { IncomeReceiptsResolver } from "@/modules/income-receipts/presentation/graphql/resolvers/income-receipts.resolver";

class InMemoryIncomeReceiptRepository implements IncomeReceiptRepositoryPort {
  private installments: ReceiptInstallmentView[] = [
    {
      idIncomeInstallment: "inst-1",
      idIncome: "income-1",
      installmentNumber: 1,
      amountDue: 100,
      amountReceived: 0,
      dueDate: new Date("2026-07-01"),
      status: IncomeStatus.PENDING,
    },
    {
      idIncomeInstallment: "inst-2",
      idIncome: "income-1",
      installmentNumber: 2,
      amountDue: 100,
      amountReceived: 0,
      dueDate: new Date("2026-08-01"),
      status: IncomeStatus.PENDING,
    },
  ];

  private receipts: IncomeReceiptView[] = [];

  async registerInstallmentReceipt(
    idUsers: string,
    command: RegisterInstallmentReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult> {
    const allocation = ReceiptAllocationService.allocate(
      this.installments,
      command.amountReceived,
      command.idIncomeInstallment,
    );

    const receivedAt = command.receivedAt ?? new Date();
    const created: IncomeReceiptView[] = [];

    for (const line of allocation.lines) {
      const installment = this.installments.find(
        (item) => item.idIncomeInstallment === line.idIncomeInstallment,
      );
      if (!installment) continue;

      installment.amountReceived = line.resultingAmountReceived;
      installment.status = line.resultingStatus;
      if (line.fullyReceivedByThisAllocation) {
        installment.receivedAt = receivedAt;
      }

      const receipt: IncomeReceiptView = {
        idIncomeReceipt: `receipt-${this.receipts.length + created.length + 1}`,
        idIncome: command.idIncome,
        idIncomeInstallment: line.idIncomeInstallment,
        idUsers,
        amountReceived: line.amountApplied,
        receivedAt,
        createdAt: new Date(),
      };
      created.push(receipt);
    }

    this.receipts.unshift(...created);

    const incomeStatus = this.installments.every(
      (installment) => installment.status === IncomeStatus.RECEIVED,
    )
      ? IncomeStatus.RECEIVED
      : IncomeStatus.PARTIALLY_RECEIVED;

    return {
      idIncome: command.idIncome,
      incomeStatus,
      receipts: created,
      installments: this.installments,
    };
  }

  async listReceiptsForIncome(): Promise<IncomeReceiptView[]> {
    return this.receipts;
  }

  async updateReceipt(
    _idUsers: string,
    command: UpdateIncomeReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult> {
    const receipt = this.receipts.find(
      (item) => item.idIncomeReceipt === command.idIncomeReceipt,
    );
    if (!receipt) {
      throw new Error("receipt not found");
    }
    if (command.amountReceived !== undefined) {
      receipt.amountReceived = command.amountReceived;
    }
    if (command.receivedAt !== undefined) {
      receipt.receivedAt = command.receivedAt;
    }

    return this.recompute(receipt.idIncome);
  }

  async deleteReceipt(
    _idUsers: string,
    idIncomeReceipt: string,
  ): Promise<RegisterInstallmentReceiptResult> {
    const receipt = this.receipts.find(
      (item) => item.idIncomeReceipt === idIncomeReceipt,
    );
    if (!receipt) {
      throw new Error("receipt not found");
    }
    this.receipts = this.receipts.filter(
      (item) => item.idIncomeReceipt !== idIncomeReceipt,
    );

    return this.recompute(receipt.idIncome);
  }

  private async recompute(
    idIncome: string,
  ): Promise<RegisterInstallmentReceiptResult> {
    for (const installment of this.installments) {
      const ledgerRows = this.receipts.filter(
        (item) => item.idIncomeInstallment === installment.idIncomeInstallment,
      );
      const total = ledgerRows.reduce(
        (sum, row) => sum + row.amountReceived,
        0,
      );
      installment.amountReceived = total;
      installment.status =
        total <= 0
          ? IncomeStatus.PENDING
          : total >= installment.amountDue
            ? IncomeStatus.RECEIVED
            : IncomeStatus.PARTIALLY_RECEIVED;
    }

    const incomeStatus = this.installments.every(
      (installment) => installment.status === IncomeStatus.RECEIVED,
    )
      ? IncomeStatus.RECEIVED
      : this.installments.some(
            (installment) =>
              installment.status === IncomeStatus.PARTIALLY_RECEIVED,
          )
        ? IncomeStatus.PARTIALLY_RECEIVED
        : IncomeStatus.PENDING;

    return {
      idIncome,
      incomeStatus,
      receipts: this.receipts.filter((item) => item.idIncome === idIncome),
      installments: this.installments,
    };
  }
}

describe("Income receipts GraphQL flow (register installment receipt)", () => {
  it("cascades an overpayment onto the next installment and records both receipt lines", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        IncomeReceiptsResolver,
        RegisterInstallmentReceiptUseCase,
        ListIncomeReceiptsUseCase,
        UpdateIncomeReceiptUseCase,
        DeleteIncomeReceiptUseCase,
        {
          provide: AuthorizationService,
          useValue: {
            assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: INCOME_RECEIPT_REPOSITORY,
          useValue: new InMemoryIncomeReceiptRepository(),
        },
      ],
    }).compile();

    const resolver = moduleRef.get(IncomeReceiptsResolver);
    const user = {
      idUsers: "user-1",
      username: "john",
      group: "USER" as never,
    };

    const result = await resolver.registerInstallmentReceipt(user, {
      idIncome: "income-1",
      idIncomeInstallment: "inst-1",
      amountReceived: 150,
    });

    expect(result.data.incomeStatus).toBe(IncomeStatus.PARTIALLY_RECEIVED);
    expect(result.data.receipts).toHaveLength(2);
    expect(result.data.receipts[0]).toMatchObject({
      idIncomeInstallment: "inst-1",
      amountReceived: 100,
    });
    expect(result.data.receipts[1]).toMatchObject({
      idIncomeInstallment: "inst-2",
      amountReceived: 50,
    });

    const installmentOne = result.data.installments.find(
      (installment) => installment.idIncomeInstallment === "inst-1",
    );
    const installmentTwo = result.data.installments.find(
      (installment) => installment.idIncomeInstallment === "inst-2",
    );

    expect(installmentOne?.status).toBe(IncomeStatus.RECEIVED);
    expect(installmentTwo?.status).toBe(IncomeStatus.PARTIALLY_RECEIVED);
    expect(installmentTwo?.amountReceived).toBe(50);

    const history = await resolver.getIncomeReceipts(user, "income-1");
    expect(history).toHaveLength(2);
  });
});
