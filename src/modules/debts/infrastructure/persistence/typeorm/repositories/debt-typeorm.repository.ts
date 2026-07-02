import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  type CreateDebtInstallmentPayload,
  type CreateDebtPayload,
  type DebtInstallmentView,
  type DebtPaymentView,
  type DebtRepositoryPort,
  type DebtView,
  type ListDebtsFilters,
  type RegisterDebtPaymentPayload,
  type UpdateDebtStatusPayload,
} from "@/modules/debts/application/ports/debt-repository.port";
import { AccountEntity } from "@/modules/accounts/infrastructure/persistence/typeorm/entities/account.entity";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtPaymentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-payment.entity";

@Injectable()
export class DebtTypeormRepository implements DebtRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DebtEntity)
    private readonly debtRepository: Repository<DebtEntity>,
    @InjectRepository(DebtInstallmentEntity)
    private readonly installmentRepository: Repository<DebtInstallmentEntity>,
    @InjectRepository(DebtPaymentEntity)
    private readonly paymentRepository: Repository<DebtPaymentEntity>,
  ) {}

  async create(
    payload: CreateDebtPayload,
    installments: CreateDebtInstallmentPayload[],
  ): Promise<DebtView> {
    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(DebtInstallmentEntity);

      const created = debtRepository.create({
        ...payload,
        totalAmount: payload.totalAmount.toFixed(2),
      });

      const saved = await debtRepository.save(created);

      const installmentEntities = installments.map((installment) =>
        installmentRepository.create({
          idDebt: saved.idDebt,
          installmentNumber: installment.installmentNumber,
          amountDue: installment.amountDue.toFixed(2),
          amountPaid: (installment.amountPaid ?? 0).toFixed(2),
          dueDate: installment.dueDate,
          paidAt: installment.paidAt,
          status: installment.status,
        }),
      );

      const savedInstallments = await installmentRepository.save(installmentEntities);
      return this.mapToView(saved, savedInstallments, []);
    });
  }

  async findById(idUsers: string, idDebt: string): Promise<DebtView> {
    const debt = await this.debtRepository.findOne({
      where: { idDebt, idUsers },
    });

    if (!debt) {
      throw AppException.from(APP_ERRORS.debts.notFound, undefined);
    }

    const installments = await this.installmentRepository.find({
      where: { idDebt: debt.idDebt },
      order: { installmentNumber: "ASC" },
    });

    const payments = await this.paymentRepository.find({
      where: { idDebt: debt.idDebt },
      order: { paidAt: "DESC" },
    });

    return this.mapToView(debt, installments, payments);
  }

  async registerPayment(
    idUsers: string,
    payload: RegisterDebtPaymentPayload,
  ): Promise<DebtView> {
    if (!Number.isFinite(payload.amountPaid) || payload.amountPaid <= 0) {
      throw AppException.from(APP_ERRORS.debts.invalidPaymentAmount, undefined);
    }

    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(DebtInstallmentEntity);
      const accountRepository = manager.getRepository(AccountEntity);

      const debt = await debtRepository.findOne({
        where: { idDebt: payload.idDebt, idUsers },
      });

      if (!debt) {
        throw AppException.from(APP_ERRORS.debts.notFound, undefined);
      }

      const account = await accountRepository.findOne({
        where: {
          idUsers,
          idAccount: debt.idAccount,
          isActive: true,
        },
      });

      if (!account) {
        throw AppException.from(APP_ERRORS.accounts.notFound, undefined);
      }

      if (Number(account.currentBalance) < payload.amountPaid) {
        throw AppException.from(APP_ERRORS.accounts.insufficientBalance, undefined);
      }

      const installments = await installmentRepository.find({
        where: { idDebt: debt.idDebt },
        order: { installmentNumber: "ASC" },
      });

      if (!installments.length) {
        throw AppException.from(APP_ERRORS.debts.installmentsNotFound, undefined);
      }

      const totalOutstanding = installments.reduce((acc, installment) => {
        const amountDue = Number(installment.amountDue);
        const amountPaid = Number(installment.amountPaid);
        return acc + Math.max(amountDue - amountPaid, 0);
      }, 0);

      if (payload.amountPaid - totalOutstanding > 0.001) {
        throw AppException.from(APP_ERRORS.debts.paymentExceedsOutstanding, undefined);
      }

      let remaining = Number(payload.amountPaid.toFixed(2));
      const paidAt = payload.paidAt ?? new Date();

      const payment = manager.getRepository(DebtPaymentEntity).create({
        idDebt: debt.idDebt,
        idUsers,
        amountPaid: payload.amountPaid.toFixed(2),
        paidAt,
      });
      await manager.getRepository(DebtPaymentEntity).save(payment);

      account.currentBalance = (Number(account.currentBalance) - payload.amountPaid).toFixed(
        2,
      );
      await accountRepository.save(account);

      for (const installment of installments) {
        if (remaining <= 0) {
          break;
        }

        const amountDue = Number(installment.amountDue);
        const alreadyPaid = Number(installment.amountPaid);
        const outstanding = Number(Math.max(amountDue - alreadyPaid, 0).toFixed(2));

        if (outstanding <= 0) {
          continue;
        }

        const paymentToApply = Math.min(outstanding, remaining);
        const nextPaid = Number((alreadyPaid + paymentToApply).toFixed(2));
        remaining = Number((remaining - paymentToApply).toFixed(2));

        installment.amountPaid = nextPaid.toFixed(2);
        installment.status =
          nextPaid >= amountDue ? DebtStatus.PAID : DebtStatus.PARTIALLY_PAID;

        if (installment.status === DebtStatus.PAID && !installment.paidAt) {
          installment.paidAt = paidAt;
        }
      }

      await installmentRepository.save(installments);

      const aggregateStatus = this.computeDebtStatus(installments);
      debt.status = aggregateStatus;
      debt.settledAt = aggregateStatus === DebtStatus.PAID ? paidAt : undefined;
      const savedDebt = await debtRepository.save(debt);

      const payments = await manager.getRepository(DebtPaymentEntity).find({
        where: { idDebt: debt.idDebt },
        order: { paidAt: "DESC" },
      });

      return this.mapToView(savedDebt, installments, payments);
    });
  }

  async updateStatus(
    idUsers: string,
    payload: UpdateDebtStatusPayload,
  ): Promise<DebtView> {
    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(DebtInstallmentEntity);

      const debt = await debtRepository.findOne({
        where: { idDebt: payload.idDebt, idUsers },
      });

      if (!debt) {
        throw AppException.from(APP_ERRORS.debts.notFound, undefined);
      }

      const installments = await installmentRepository.find({
        where: { idDebt: debt.idDebt },
        order: { installmentNumber: "ASC" },
      });

      if (payload.status === DebtStatus.OPEN || payload.status === DebtStatus.OVERDUE) {
        for (const installment of installments) {
          const amountDue = Number(installment.amountDue);
          const amountPaid = Number(installment.amountPaid);
          if (amountPaid < amountDue) {
            installment.status = payload.status;
          }
        }
      }

      await installmentRepository.save(installments);

      debt.status = payload.status;
      debt.settledAt = payload.status === DebtStatus.PAID ? new Date() : undefined;
      const savedDebt = await debtRepository.save(debt);

      const payments = await manager.getRepository(DebtPaymentEntity).find({
        where: { idDebt: debt.idDebt },
        order: { paidAt: "DESC" },
      });

      return this.mapToView(savedDebt, installments, payments);
    });
  }

  async listByUser(
    idUsers: string,
    filters?: ListDebtsFilters,
  ): Promise<{ records: DebtView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const qb = this.debtRepository
      .createQueryBuilder("debt")
      .where("debt.idUsers = :idUsers", { idUsers })
      .orderBy("debt.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.status) {
      qb.andWhere("debt.status = :status", { status: filters.status });
    }

    if (filters?.debtType) {
      qb.andWhere("debt.debtType = :debtType", { debtType: filters.debtType });
    }

    const [rows, total] = await qb.getManyAndCount();

    const ids = rows.map((row) => row.idDebt);
    const installments = ids.length
      ? await this.installmentRepository.find({
          where: { idDebt: In(ids) },
          order: { installmentNumber: "ASC" },
        })
      : [];

    const installmentsByDebt = new Map<string, DebtInstallmentEntity[]>();
    for (const installment of installments) {
      const current = installmentsByDebt.get(installment.idDebt) ?? [];
      current.push(installment);
      installmentsByDebt.set(installment.idDebt, current);
    }

    const payments = ids.length
      ? await this.paymentRepository.find({
          where: { idDebt: In(ids) },
          order: { paidAt: "DESC" },
        })
      : [];

    const paymentsByDebt = new Map<string, DebtPaymentEntity[]>();
    for (const payment of payments) {
      const current = paymentsByDebt.get(payment.idDebt) ?? [];
      current.push(payment);
      paymentsByDebt.set(payment.idDebt, current);
    }

    return {
      records: rows.map((row) =>
        this.mapToView(
          row,
          installmentsByDebt.get(row.idDebt) ?? [],
          paymentsByDebt.get(row.idDebt) ?? [],
        ),
      ),
      total,
    };
  }

  private computeDebtStatus(installments: DebtInstallmentEntity[]): DebtStatus {
    if (installments.every((installment) => installment.status === DebtStatus.PAID)) {
      return DebtStatus.PAID;
    }

    if (
      installments.some(
        (installment) => installment.status === DebtStatus.PARTIALLY_PAID,
      )
    ) {
      return DebtStatus.PARTIALLY_PAID;
    }

    if (installments.some((installment) => installment.status === DebtStatus.OVERDUE)) {
      return DebtStatus.OVERDUE;
    }

    return DebtStatus.OPEN;
  }

  private mapInstallmentToView(entity: DebtInstallmentEntity): DebtInstallmentView {
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
      idUsers: entity.idUsers,
      amountPaid: Number(entity.amountPaid),
      paidAt: entity.paidAt,
      createdAt: entity.createdAt,
    };
  }

  private mapToView(
    entity: DebtEntity,
    installments: DebtInstallmentEntity[],
    payments: DebtPaymentEntity[],
  ): DebtView {
    return {
      idDebt: entity.idDebt,
      idUsers: entity.idUsers,
      idAccount: entity.idAccount,
      title: entity.title,
      description: entity.description,
      debtType: entity.debtType,
      totalAmount: Number(entity.totalAmount),
      startDate: entity.startDate,
      hasInstallments: entity.hasInstallments,
      installmentCount: entity.installmentCount,
      status: entity.status,
      settledAt: entity.settledAt,
      installments: installments.map((installment) =>
        this.mapInstallmentToView(installment),
      ),
      payments: payments.map((payment) => this.mapPaymentToView(payment)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
