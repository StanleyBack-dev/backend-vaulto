import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { toDateOnlyString } from "@/common/utils/date.util";
import {
  type CreateDebtInstallmentPayload,
  type CreateDebtPayload,
  type DebtInstallmentView,
  type DebtPaymentView,
  type DebtRepositoryPort,
  type DebtView,
  type ListDebtsFilters,
  type UpdateDebtDetailsPayload,
  type UpdateDebtStatusPayload,
} from "@/modules/debts/application/ports/debt-repository.port";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { CreditCardEntity } from "@/modules/credit-cards/infrastructure/persistence/typeorm/entities/credit-card.entity";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtPaymentEntity } from "@/modules/payments/infrastructure/persistence/typeorm/entities/debt-payment.entity";

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
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(CreditCardEntity)
    private readonly creditCardRepository: Repository<CreditCardEntity>,
  ) {}

  async create(
    payload: CreateDebtPayload,
    installments: CreateDebtInstallmentPayload[],
  ): Promise<DebtView> {
    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(
        DebtInstallmentEntity,
      );

      const created = debtRepository.create({
        idUsers: payload.idUsers,
        idCategory: payload.idCategory,
        idCreditCard: payload.idCreditCard,
        title: payload.title,
        description: payload.description,
        debtType: payload.debtType,
        startDate: payload.startDate,
        hasInstallments: payload.hasInstallments,
        installmentCount: payload.installmentCount,
        status: payload.status,
        dueDate: payload.dueDate,
        acquiredAt: payload.acquiredAt,
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

      const savedInstallments =
        await installmentRepository.save(installmentEntities);
      const category = await manager.getRepository(CategoryEntity).findOne({
        where: { idCategory: saved.idCategory },
      });
      return this.mapToView(
        saved,
        savedInstallments,
        [],
        category?.name ?? "",
        payload.creditCard,
      );
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

    const category = await this.categoryRepository.findOne({
      where: { idCategory: debt.idCategory },
    });
    const creditCard = await this.findCreditCardName(debt.idCreditCard);

    return this.mapToView(
      debt,
      installments,
      payments,
      category?.name ?? "",
      creditCard,
    );
  }

  async updateStatus(
    idUsers: string,
    payload: UpdateDebtStatusPayload,
  ): Promise<DebtView> {
    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(
        DebtInstallmentEntity,
      );

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

      if (
        payload.status === DebtStatus.OPEN ||
        payload.status === DebtStatus.OVERDUE
      ) {
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
      debt.settledAt =
        payload.status === DebtStatus.PAID ? new Date() : undefined;
      const savedDebt = await debtRepository.save(debt);

      const payments = await manager.getRepository(DebtPaymentEntity).find({
        where: { idDebt: debt.idDebt },
        order: { paidAt: "DESC" },
      });

      const category = await manager.getRepository(CategoryEntity).findOne({
        where: { idCategory: savedDebt.idCategory },
      });
      const creditCard = await this.findCreditCardName(
        savedDebt.idCreditCard,
        manager.getRepository(CreditCardEntity),
      );

      return this.mapToView(
        savedDebt,
        installments,
        payments,
        category?.name ?? "",
        creditCard,
      );
    });
  }

  async updateDetails(
    idUsers: string,
    payload: UpdateDebtDetailsPayload,
  ): Promise<DebtView> {
    return this.dataSource.transaction(async (manager) => {
      const debtRepository = manager.getRepository(DebtEntity);
      const installmentRepository = manager.getRepository(
        DebtInstallmentEntity,
      );

      const debt = await debtRepository.findOne({
        where: { idDebt: payload.idDebt, idUsers },
      });

      if (!debt) {
        throw AppException.from(APP_ERRORS.debts.notFound, undefined);
      }

      if (payload.title !== undefined) {
        debt.title = payload.title;
      }

      if (payload.description !== undefined) {
        debt.description = payload.description;
      }

      if (payload.idCategory !== undefined) {
        debt.idCategory = payload.idCategory;
      }

      if (payload.debtType !== undefined) {
        debt.debtType = payload.debtType;
      }

      if (payload.acquiredAt !== undefined) {
        debt.acquiredAt = payload.acquiredAt;
      }

      const installments = await installmentRepository.find({
        where: { idDebt: debt.idDebt },
        order: { installmentNumber: "ASC" },
      });

      if (payload.dueDate !== undefined) {
        if (debt.hasInstallments) {
          throw AppException.from(
            APP_ERRORS.debts.dueDateNotEditableForInstallments,
            undefined,
          );
        }

        if (debt.idCreditCard) {
          throw AppException.from(
            APP_ERRORS.debts.dueDateNotEditableForCreditCard,
            undefined,
          );
        }

        debt.dueDate = payload.dueDate;

        if (installments[0]) {
          installments[0].dueDate = payload.dueDate;
          await installmentRepository.save(installments[0]);
        }
      }

      if (payload.totalAmount !== undefined) {
        if (debt.hasInstallments) {
          throw AppException.from(
            APP_ERRORS.debts.totalAmountNotEditableForInstallments,
            undefined,
          );
        }

        debt.totalAmount = payload.totalAmount.toFixed(2);

        if (installments[0]) {
          installments[0].amountDue = payload.totalAmount.toFixed(2);
          await installmentRepository.save(installments[0]);
        }
      }

      const savedDebt = await debtRepository.save(debt);

      const payments = await manager.getRepository(DebtPaymentEntity).find({
        where: { idDebt: savedDebt.idDebt },
        order: { paidAt: "DESC" },
      });

      const category = await manager.getRepository(CategoryEntity).findOne({
        where: { idCategory: savedDebt.idCategory },
      });
      const creditCard = await this.findCreditCardName(
        savedDebt.idCreditCard,
        manager.getRepository(CreditCardEntity),
      );

      return this.mapToView(
        savedDebt,
        installments,
        payments,
        category?.name ?? "",
        creditCard,
      );
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

    if (filters?.idCategory) {
      qb.andWhere("debt.idCategory = :idCategory", {
        idCategory: filters.idCategory,
      });
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      const existsInstallmentInRange = this.installmentRepository
        .createQueryBuilder("di")
        .select("1")
        .where("di.idDebt = CAST(debt.idDebt AS varchar)");

      if (filters.dueDateFrom) {
        existsInstallmentInRange.andWhere("di.dueDate >= :dueDateFrom", {
          dueDateFrom: toDateOnlyString(filters.dueDateFrom),
        });
      }

      if (filters.dueDateTo) {
        existsInstallmentInRange.andWhere("di.dueDate <= :dueDateTo", {
          dueDateTo: toDateOnlyString(filters.dueDateTo),
        });
      }

      qb.andWhere(
        `EXISTS (${existsInstallmentInRange.getQuery()})`,
      ).setParameters(existsInstallmentInRange.getParameters());
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

    const categoryIds = Array.from(
      new Set(rows.map((row) => row.idCategory).filter(Boolean)),
    );
    const categories = categoryIds.length
      ? await this.categoryRepository.find({
          where: { idCategory: In(categoryIds) },
        })
      : [];
    const categoryById = new Map(
      categories.map((category) => [category.idCategory, category.name]),
    );

    const creditCardIds = Array.from(
      new Set(
        rows
          .map((row) => row.idCreditCard)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const creditCards = creditCardIds.length
      ? await this.creditCardRepository.find({
          where: { idCreditCard: In(creditCardIds) },
        })
      : [];
    const creditCardById = new Map(
      creditCards.map((creditCard) => [
        creditCard.idCreditCard,
        creditCard.name,
      ]),
    );

    return {
      records: rows.map((row) =>
        this.mapToView(
          row,
          installmentsByDebt.get(row.idDebt) ?? [],
          paymentsByDebt.get(row.idDebt) ?? [],
          categoryById.get(row.idCategory) ?? "",
          row.idCreditCard ? creditCardById.get(row.idCreditCard) : undefined,
        ),
      ),
      total,
    };
  }

  private computeEndDate(
    entity: DebtEntity,
    installments: DebtInstallmentEntity[],
  ): Date | undefined {
    if (!installments.length) {
      return entity.dueDate;
    }

    return installments.reduce<Date>(
      (latest, installment) =>
        installment.dueDate > latest ? installment.dueDate : latest,
      installments[0].dueDate,
    );
  }

  private mapInstallmentToView(
    entity: DebtInstallmentEntity,
  ): DebtInstallmentView {
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

  private async findCreditCardName(
    idCreditCard: string | undefined,
    repository: Repository<CreditCardEntity> = this.creditCardRepository,
  ): Promise<string | undefined> {
    if (!idCreditCard) {
      return undefined;
    }

    const creditCard = await repository.findOne({ where: { idCreditCard } });
    return creditCard?.name;
  }

  private mapToView(
    entity: DebtEntity,
    installments: DebtInstallmentEntity[],
    payments: DebtPaymentEntity[],
    category: string,
    creditCard?: string,
  ): DebtView {
    return {
      idDebt: entity.idDebt,
      idUsers: entity.idUsers,
      idCategory: entity.idCategory,
      title: entity.title,
      category,
      idCreditCard: entity.idCreditCard,
      creditCard,
      description: entity.description,
      debtType: entity.debtType,
      totalAmount: Number(entity.totalAmount),
      dueDate: entity.dueDate,
      acquiredAt: entity.acquiredAt,
      endDate: this.computeEndDate(entity, installments),
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
