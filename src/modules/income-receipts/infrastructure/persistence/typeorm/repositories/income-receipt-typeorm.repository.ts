import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { ReceiptAllocationService } from "@/modules/income-receipts/domain/services/receipt-allocation.service";
import type {
  IncomeReceiptRepositoryPort,
  IncomeReceiptView,
  ReceiptInstallmentView,
  RegisterInstallmentReceiptCommand,
  RegisterInstallmentReceiptResult,
  UpdateIncomeReceiptCommand,
} from "@/modules/income-receipts/application/ports/income-receipt-repository.port";
import { IncomeReceiptEntity } from "@/modules/income-receipts/infrastructure/persistence/typeorm/entities/income-receipt.entity";

@Injectable()
export class IncomeReceiptTypeormRepository
  implements IncomeReceiptRepositoryPort
{
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(IncomeReceiptEntity)
    private readonly receiptRepository: Repository<IncomeReceiptEntity>,
  ) {}

  async registerInstallmentReceipt(
    idUsers: string,
    command: RegisterInstallmentReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult> {
    return this.dataSource.transaction(async (manager) => {
      const incomeRepository = manager.getRepository(IncomeEntity);
      const installmentRepository = manager.getRepository(
        IncomeInstallmentEntity,
      );
      const receiptRepository = manager.getRepository(IncomeReceiptEntity);

      const income = await incomeRepository.findOne({
        where: { idIncome: command.idIncome, idUsers },
      });

      if (!income) {
        throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
      }

      const installments = await installmentRepository.find({
        where: { idIncome: income.idIncome },
        order: { installmentNumber: "ASC" },
      });

      const target = installments.find(
        (installment) =>
          installment.idIncomeInstallment === command.idIncomeInstallment,
      );

      if (!target) {
        throw AppException.from(
          APP_ERRORS.incomeReceipts.installmentNotFound,
          undefined,
        );
      }

      if (!income.hasInstallments) {
        // Incomes without an installment plan represent a recurring/
        // standalone receivable: the due amount is a fixed reference edited
        // only through the income's own form. Receipts here are
        // independent history entries — never capped by the outstanding
        // balance and never blocked once already received, unlike the
        // cascading allocation used for parceladas.
        const receivedAt = command.receivedAt ?? new Date();
        const newAmountReceived =
          Number(target.amountReceived) + command.amountReceived;
        target.amountReceived = newAmountReceived.toFixed(2);
        target.receivedAt = receivedAt;
        target.status =
          newAmountReceived >= Number(target.amountDue)
            ? IncomeStatus.RECEIVED
            : IncomeStatus.PARTIALLY_RECEIVED;

        const createdReceipt = receiptRepository.create({
          idIncome: income.idIncome,
          idIncomeInstallment: target.idIncomeInstallment,
          idUsers,
          amountReceived: command.amountReceived.toFixed(2),
          receivedAt,
        });

        await installmentRepository.save(target);
        await receiptRepository.save(createdReceipt);

        income.status = target.status;
        income.receivedAt =
          target.status === IncomeStatus.RECEIVED ? receivedAt : undefined;
        await incomeRepository.save(income);

        return {
          idIncome: income.idIncome,
          incomeStatus: income.status,
          receipts: [this.mapReceiptToView(createdReceipt)],
          installments: installments.map((installment) =>
            this.mapInstallmentToView(installment),
          ),
        };
      }

      if (Number(target.amountReceived) >= Number(target.amountDue)) {
        throw AppException.from(
          APP_ERRORS.incomeReceipts.installmentAlreadyReceived,
          undefined,
        );
      }

      const allocation = ReceiptAllocationService.allocate(
        installments.map((installment) => ({
          idIncomeInstallment: installment.idIncomeInstallment,
          installmentNumber: installment.installmentNumber,
          amountDue: Number(installment.amountDue),
          amountReceived: Number(installment.amountReceived),
          status: installment.status,
        })),
        command.amountReceived,
        command.idIncomeInstallment,
      );

      if (allocation.remainderUnallocated > 0) {
        throw AppException.from(
          APP_ERRORS.incomeReceipts.amountExceedsOutstanding,
          undefined,
        );
      }

      const receivedAt = command.receivedAt ?? new Date();
      const installmentById = new Map(
        installments.map((installment) => [
          installment.idIncomeInstallment,
          installment,
        ]),
      );
      const createdReceipts: IncomeReceiptEntity[] = [];

      for (const line of allocation.lines) {
        const installment = installmentById.get(line.idIncomeInstallment);
        if (!installment) {
          continue;
        }

        installment.amountReceived = line.resultingAmountReceived.toFixed(2);
        installment.status = line.resultingStatus;
        if (line.fullyReceivedByThisAllocation) {
          installment.receivedAt = receivedAt;
        }

        createdReceipts.push(
          receiptRepository.create({
            idIncome: income.idIncome,
            idIncomeInstallment: line.idIncomeInstallment,
            idUsers,
            amountReceived: line.amountApplied.toFixed(2),
            receivedAt,
          }),
        );
      }

      await installmentRepository.save(installments);
      await receiptRepository.save(createdReceipts);

      const aggregateStatus = this.computeIncomeStatus(installments);
      income.status = aggregateStatus;
      income.receivedAt =
        aggregateStatus === IncomeStatus.RECEIVED ? receivedAt : undefined;
      await incomeRepository.save(income);

      return {
        idIncome: income.idIncome,
        incomeStatus: aggregateStatus,
        receipts: createdReceipts.map((receipt) =>
          this.mapReceiptToView(receipt),
        ),
        installments: installments.map((installment) =>
          this.mapInstallmentToView(installment),
        ),
      };
    });
  }

  async listReceiptsForIncome(
    idUsers: string,
    idIncome: string,
  ): Promise<IncomeReceiptView[]> {
    const receipts = await this.receiptRepository.find({
      where: { idIncome, idUsers },
      order: { receivedAt: "DESC" },
    });

    return receipts.map((receipt) => this.mapReceiptToView(receipt));
  }

  async updateReceipt(
    idUsers: string,
    command: UpdateIncomeReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult> {
    if (command.amountReceived !== undefined && command.amountReceived <= 0) {
      throw AppException.from(
        APP_ERRORS.incomeReceipts.invalidAmount,
        undefined,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const receiptRepository = manager.getRepository(IncomeReceiptEntity);

      const receipt = await receiptRepository.findOne({
        where: { idIncomeReceipt: command.idIncomeReceipt, idUsers },
      });

      if (!receipt) {
        throw AppException.from(
          APP_ERRORS.incomeReceipts.receiptNotFound,
          undefined,
        );
      }

      if (command.amountReceived !== undefined) {
        receipt.amountReceived = command.amountReceived.toFixed(2);
      }
      if (command.receivedAt !== undefined) {
        receipt.receivedAt = command.receivedAt;
      }

      await receiptRepository.save(receipt);

      return this.recomputeIncomeAfterLedgerChange(
        manager,
        idUsers,
        receipt.idIncome,
      );
    });
  }

  async deleteReceipt(
    idUsers: string,
    idIncomeReceipt: string,
  ): Promise<RegisterInstallmentReceiptResult> {
    return this.dataSource.transaction(async (manager) => {
      const receiptRepository = manager.getRepository(IncomeReceiptEntity);

      const receipt = await receiptRepository.findOne({
        where: { idIncomeReceipt, idUsers },
      });

      if (!receipt) {
        throw AppException.from(
          APP_ERRORS.incomeReceipts.receiptNotFound,
          undefined,
        );
      }

      const idIncome = receipt.idIncome;
      await receiptRepository.remove(receipt);

      return this.recomputeIncomeAfterLedgerChange(manager, idUsers, idIncome);
    });
  }

  private async recomputeIncomeAfterLedgerChange(
    manager: EntityManager,
    idUsers: string,
    idIncome: string,
  ): Promise<RegisterInstallmentReceiptResult> {
    const incomeRepository = manager.getRepository(IncomeEntity);
    const installmentRepository = manager.getRepository(
      IncomeInstallmentEntity,
    );
    const receiptRepository = manager.getRepository(IncomeReceiptEntity);

    const income = await incomeRepository.findOne({
      where: { idIncome, idUsers },
    });
    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    const installments = await installmentRepository.find({
      where: { idIncome: income.idIncome },
      order: { installmentNumber: "ASC" },
    });

    for (const installment of installments) {
      const ledgerRows = await receiptRepository.find({
        where: { idIncomeInstallment: installment.idIncomeInstallment },
      });

      const total = Number(
        ledgerRows
          .reduce((sum, row) => sum + Number(row.amountReceived), 0)
          .toFixed(2),
      );

      if (total > Number(installment.amountDue)) {
        throw AppException.from(
          APP_ERRORS.incomeReceipts.amountExceedsOutstanding,
          undefined,
        );
      }

      installment.amountReceived = total.toFixed(2);
      if (total <= 0) {
        installment.status = IncomeStatus.PENDING;
        installment.receivedAt = undefined;
      } else if (total >= Number(installment.amountDue)) {
        installment.status = IncomeStatus.RECEIVED;
        installment.receivedAt = ledgerRows.reduce<Date | undefined>(
          (latest, row) =>
            !latest || row.receivedAt > latest ? row.receivedAt : latest,
          undefined,
        );
      } else {
        installment.status = IncomeStatus.PARTIALLY_RECEIVED;
        installment.receivedAt = undefined;
      }
    }

    await installmentRepository.save(installments);

    const aggregateStatus = this.computeIncomeStatus(installments);
    income.status = aggregateStatus;
    income.receivedAt =
      aggregateStatus === IncomeStatus.RECEIVED ? new Date() : undefined;
    await incomeRepository.save(income);

    const allReceipts = await receiptRepository.find({
      where: { idIncome: income.idIncome, idUsers },
      order: { receivedAt: "DESC" },
    });

    return {
      idIncome: income.idIncome,
      incomeStatus: aggregateStatus,
      receipts: allReceipts.map((receipt) => this.mapReceiptToView(receipt)),
      installments: installments.map((installment) =>
        this.mapInstallmentToView(installment),
      ),
    };
  }

  private computeIncomeStatus(
    installments: IncomeInstallmentEntity[],
  ): IncomeStatus {
    if (
      installments.every(
        (installment) => installment.status === IncomeStatus.RECEIVED,
      )
    ) {
      return IncomeStatus.RECEIVED;
    }

    if (
      installments.some(
        (installment) => installment.status === IncomeStatus.PARTIALLY_RECEIVED,
      )
    ) {
      return IncomeStatus.PARTIALLY_RECEIVED;
    }

    if (
      installments.some(
        (installment) => installment.status === IncomeStatus.OVERDUE,
      )
    ) {
      return IncomeStatus.OVERDUE;
    }

    return IncomeStatus.PENDING;
  }

  private mapInstallmentToView(
    entity: IncomeInstallmentEntity,
  ): ReceiptInstallmentView {
    return {
      idIncomeInstallment: entity.idIncomeInstallment,
      idIncome: entity.idIncome,
      installmentNumber: entity.installmentNumber,
      amountDue: Number(entity.amountDue),
      amountReceived: Number(entity.amountReceived),
      dueDate: entity.dueDate,
      receivedAt: entity.receivedAt,
      status: entity.status,
    };
  }

  private mapReceiptToView(entity: IncomeReceiptEntity): IncomeReceiptView {
    return {
      idIncomeReceipt: entity.idIncomeReceipt,
      idIncome: entity.idIncome,
      idIncomeInstallment: entity.idIncomeInstallment,
      idUsers: entity.idUsers,
      amountReceived: Number(entity.amountReceived),
      receivedAt: entity.receivedAt,
      createdAt: entity.createdAt,
    };
  }
}
