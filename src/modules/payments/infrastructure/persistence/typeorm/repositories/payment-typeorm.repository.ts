import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { PaymentAllocationService } from "@/modules/payments/domain/services/payment-allocation.service";
import type {
  DebtPaymentView,
  PaymentInstallmentView,
  PaymentRepositoryPort,
  RegisterInstallmentPaymentCommand,
  RegisterInstallmentPaymentResult,
  UpdateDebtPaymentCommand,
} from "@/modules/payments/application/ports/payment-repository.port";
import { DebtPaymentEntity } from "@/modules/payments/infrastructure/persistence/typeorm/entities/debt-payment.entity";

@Injectable()
export class PaymentTypeormRepository implements PaymentRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DebtPaymentEntity)
    private readonly paymentRepository: Repository<DebtPaymentEntity>,
  ) {}

  async registerInstallmentPayment(
    idUsers: string,
    command: RegisterInstallmentPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult> {
    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(
        DebtInstallmentEntity,
      );
      const paymentRepository = manager.getRepository(DebtPaymentEntity);

      const debt = await debtRepository.findOne({
        where: { idDebt: command.idDebt, idUsers },
      });

      if (!debt) {
        throw AppException.from(APP_ERRORS.debts.notFound, undefined);
      }

      const installments = await installmentRepository.find({
        where: { idDebt: debt.idDebt },
        order: { installmentNumber: "ASC" },
      });

      const target = installments.find(
        (installment) =>
          installment.idDebtInstallment === command.idDebtInstallment,
      );

      if (!target) {
        throw AppException.from(
          APP_ERRORS.payments.installmentNotFound,
          undefined,
        );
      }

      if (!debt.hasInstallments) {
        // Debts without an installment plan represent a recurring/standalone
        // bill: the due amount is a fixed reference edited only through the
        // debt's own form. Payments here are independent history entries —
        // never capped by the outstanding balance and never blocked once
        // already paid, unlike the cascading allocation used for parceladas.
        const paidAt = command.paidAt ?? new Date();
        const newAmountPaid = Number(target.amountPaid) + command.amountPaid;
        target.amountPaid = newAmountPaid.toFixed(2);
        target.paidAt = paidAt;
        target.status =
          newAmountPaid >= Number(target.amountDue)
            ? DebtStatus.PAID
            : DebtStatus.PARTIALLY_PAID;

        const createdPayment = paymentRepository.create({
          idDebt: debt.idDebt,
          idDebtInstallment: target.idDebtInstallment,
          idUsers,
          amountPaid: command.amountPaid.toFixed(2),
          paidAt,
        });

        await installmentRepository.save(target);
        await paymentRepository.save(createdPayment);

        debt.status = target.status;
        debt.settledAt = target.status === DebtStatus.PAID ? paidAt : undefined;
        await debtRepository.save(debt);

        return {
          idDebt: debt.idDebt,
          debtStatus: debt.status,
          payments: [this.mapPaymentToView(createdPayment)],
          installments: installments.map((installment) =>
            this.mapInstallmentToView(installment),
          ),
        };
      }

      if (Number(target.amountPaid) >= Number(target.amountDue)) {
        throw AppException.from(
          APP_ERRORS.payments.installmentAlreadyPaid,
          undefined,
        );
      }

      const allocation = PaymentAllocationService.allocate(
        installments.map((installment) => ({
          idDebtInstallment: installment.idDebtInstallment,
          installmentNumber: installment.installmentNumber,
          amountDue: Number(installment.amountDue),
          amountPaid: Number(installment.amountPaid),
          status: installment.status,
        })),
        command.amountPaid,
        command.idDebtInstallment,
      );

      if (allocation.remainderUnallocated > 0) {
        throw AppException.from(
          APP_ERRORS.payments.amountExceedsOutstanding,
          undefined,
        );
      }

      const paidAt = command.paidAt ?? new Date();
      const installmentById = new Map(
        installments.map((installment) => [
          installment.idDebtInstallment,
          installment,
        ]),
      );
      const createdPayments: DebtPaymentEntity[] = [];

      for (const line of allocation.lines) {
        const installment = installmentById.get(line.idDebtInstallment);
        if (!installment) {
          continue;
        }

        installment.amountPaid = line.resultingAmountPaid.toFixed(2);
        installment.status = line.resultingStatus;
        if (line.fullyPaidByThisAllocation) {
          installment.paidAt = paidAt;
        }

        createdPayments.push(
          paymentRepository.create({
            idDebt: debt.idDebt,
            idDebtInstallment: line.idDebtInstallment,
            idUsers,
            amountPaid: line.amountApplied.toFixed(2),
            paidAt,
          }),
        );
      }

      await installmentRepository.save(installments);
      await paymentRepository.save(createdPayments);

      const aggregateStatus = this.computeDebtStatus(installments);
      debt.status = aggregateStatus;
      debt.settledAt = aggregateStatus === DebtStatus.PAID ? paidAt : undefined;
      await debtRepository.save(debt);

      return {
        idDebt: debt.idDebt,
        debtStatus: aggregateStatus,
        payments: createdPayments.map((payment) =>
          this.mapPaymentToView(payment),
        ),
        installments: installments.map((installment) =>
          this.mapInstallmentToView(installment),
        ),
      };
    });
  }

  async listPaymentsForDebt(
    idUsers: string,
    idDebt: string,
  ): Promise<DebtPaymentView[]> {
    const payments = await this.paymentRepository.find({
      where: { idDebt, idUsers },
      order: { paidAt: "DESC" },
    });

    return payments.map((payment) => this.mapPaymentToView(payment));
  }

  async updatePayment(
    idUsers: string,
    command: UpdateDebtPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult> {
    if (command.amountPaid !== undefined && command.amountPaid <= 0) {
      throw AppException.from(APP_ERRORS.payments.invalidAmount, undefined);
    }

    return this.dataSource.transaction(async (manager) => {
      const paymentRepository = manager.getRepository(DebtPaymentEntity);

      const payment = await paymentRepository.findOne({
        where: { idDebtPayment: command.idDebtPayment, idUsers },
      });

      if (!payment) {
        throw AppException.from(APP_ERRORS.payments.paymentNotFound, undefined);
      }

      if (command.amountPaid !== undefined) {
        payment.amountPaid = command.amountPaid.toFixed(2);
      }
      if (command.paidAt !== undefined) {
        payment.paidAt = command.paidAt;
      }

      await paymentRepository.save(payment);

      return this.recomputeDebtAfterLedgerChange(
        manager,
        idUsers,
        payment.idDebt,
      );
    });
  }

  async deletePayment(
    idUsers: string,
    idDebtPayment: string,
  ): Promise<RegisterInstallmentPaymentResult> {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepository = manager.getRepository(DebtPaymentEntity);

      const payment = await paymentRepository.findOne({
        where: { idDebtPayment, idUsers },
      });

      if (!payment) {
        throw AppException.from(APP_ERRORS.payments.paymentNotFound, undefined);
      }

      const idDebt = payment.idDebt;
      await paymentRepository.remove(payment);

      return this.recomputeDebtAfterLedgerChange(manager, idUsers, idDebt);
    });
  }

  private async recomputeDebtAfterLedgerChange(
    manager: EntityManager,
    idUsers: string,
    idDebt: string,
  ): Promise<RegisterInstallmentPaymentResult> {
    const debtRepository = manager.getRepository(DebtEntity);
    const installmentRepository = manager.getRepository(DebtInstallmentEntity);
    const paymentRepository = manager.getRepository(DebtPaymentEntity);

    const debt = await debtRepository.findOne({ where: { idDebt, idUsers } });
    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    const installments = await installmentRepository.find({
      where: { idDebt: debt.idDebt },
      order: { installmentNumber: "ASC" },
    });

    for (const installment of installments) {
      const ledgerRows = await paymentRepository.find({
        where: { idDebtInstallment: installment.idDebtInstallment },
      });

      const total = Number(
        ledgerRows
          .reduce((sum, row) => sum + Number(row.amountPaid), 0)
          .toFixed(2),
      );

      if (total > Number(installment.amountDue)) {
        throw AppException.from(
          APP_ERRORS.payments.amountExceedsOutstanding,
          undefined,
        );
      }

      installment.amountPaid = total.toFixed(2);
      if (total <= 0) {
        installment.status = DebtStatus.OPEN;
        installment.paidAt = undefined;
      } else if (total >= Number(installment.amountDue)) {
        installment.status = DebtStatus.PAID;
        installment.paidAt = ledgerRows.reduce<Date | undefined>(
          (latest, row) =>
            !latest || row.paidAt > latest ? row.paidAt : latest,
          undefined,
        );
      } else {
        installment.status = DebtStatus.PARTIALLY_PAID;
        installment.paidAt = undefined;
      }
    }

    await installmentRepository.save(installments);

    const aggregateStatus = this.computeDebtStatus(installments);
    debt.status = aggregateStatus;
    debt.settledAt =
      aggregateStatus === DebtStatus.PAID ? new Date() : undefined;
    await debtRepository.save(debt);

    const allPayments = await paymentRepository.find({
      where: { idDebt: debt.idDebt, idUsers },
      order: { paidAt: "DESC" },
    });

    return {
      idDebt: debt.idDebt,
      debtStatus: aggregateStatus,
      payments: allPayments.map((payment) => this.mapPaymentToView(payment)),
      installments: installments.map((installment) =>
        this.mapInstallmentToView(installment),
      ),
    };
  }

  private computeDebtStatus(installments: DebtInstallmentEntity[]): DebtStatus {
    if (
      installments.every(
        (installment) => installment.status === DebtStatus.PAID,
      )
    ) {
      return DebtStatus.PAID;
    }

    if (
      installments.some(
        (installment) => installment.status === DebtStatus.PARTIALLY_PAID,
      )
    ) {
      return DebtStatus.PARTIALLY_PAID;
    }

    if (
      installments.some(
        (installment) => installment.status === DebtStatus.OVERDUE,
      )
    ) {
      return DebtStatus.OVERDUE;
    }

    return DebtStatus.OPEN;
  }

  private mapInstallmentToView(
    entity: DebtInstallmentEntity,
  ): PaymentInstallmentView {
    return {
      idDebtInstallment: entity.idDebtInstallment,
      idDebt: entity.idDebt,
      installmentNumber: entity.installmentNumber,
      amountDue: Number(entity.amountDue),
      amountPaid: Number(entity.amountPaid),
      dueDate: entity.dueDate,
      paidAt: entity.paidAt,
      status: entity.status,
    };
  }

  private mapPaymentToView(entity: DebtPaymentEntity): DebtPaymentView {
    return {
      idDebtPayment: entity.idDebtPayment,
      idDebt: entity.idDebt,
      idDebtInstallment: entity.idDebtInstallment,
      idUsers: entity.idUsers,
      amountPaid: Number(entity.amountPaid),
      paidAt: entity.paidAt,
      createdAt: entity.createdAt,
    };
  }
}
