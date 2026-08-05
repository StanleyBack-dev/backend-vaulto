import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { toDateOnlyString } from "@/common/utils/date.util";
import {
  type CreateIncomeInstallmentPayload,
  type CreateIncomePayload,
  type IncomeInstallmentView,
  type IncomeRepositoryPort,
  type IncomeView,
  type ListIncomesFilters,
  type UpdateIncomeDetailsPayload,
  type UpdateIncomeStatusPayload,
} from "@/modules/incomes/application/ports/income-repository.port";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { IncomeReceiptEntity } from "@/modules/income-receipts/infrastructure/persistence/typeorm/entities/income-receipt.entity";

@Injectable()
export class IncomeTypeormRepository implements IncomeRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(IncomeEntity)
    private readonly incomeRepository: Repository<IncomeEntity>,
    @InjectRepository(IncomeInstallmentEntity)
    private readonly installmentRepository: Repository<IncomeInstallmentEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(
    payload: CreateIncomePayload,
    installments: CreateIncomeInstallmentPayload[],
  ): Promise<IncomeView> {
    return this.dataSource.transaction(async (manager) => {
      const incomeRepository = manager.getRepository(IncomeEntity);
      const installmentRepository = manager.getRepository(
        IncomeInstallmentEntity,
      );

      const created = incomeRepository.create({
        idUsers: payload.idUsers,
        idCategory: payload.idCategory,
        title: payload.title,
        description: payload.description,
        incomeType: payload.incomeType,
        startDate: payload.startDate,
        hasInstallments: payload.hasInstallments,
        installmentCount: payload.installmentCount,
        isRecurring: payload.isRecurring,
        status: payload.status,
        dueDate: payload.dueDate,
        totalAmount: payload.totalAmount.toFixed(2),
      });

      const saved = await incomeRepository.save(created);

      const installmentEntities = installments.map((installment) =>
        installmentRepository.create({
          idIncome: saved.idIncome,
          installmentNumber: installment.installmentNumber,
          amountDue: installment.amountDue.toFixed(2),
          amountReceived: (installment.amountReceived ?? 0).toFixed(2),
          dueDate: installment.dueDate,
          receivedAt: installment.receivedAt,
          status: installment.status,
        }),
      );

      const savedInstallments =
        await installmentRepository.save(installmentEntities);

      return this.mapToView(saved, savedInstallments, payload.category);
    });
  }

  async findById(idUsers: string, idIncome: string): Promise<IncomeView> {
    const income = await this.incomeRepository.findOne({
      where: { idIncome, idUsers },
    });

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    const installments = await this.installmentRepository.find({
      where: { idIncome: income.idIncome },
      order: { installmentNumber: "ASC" },
    });

    const category = await this.categoryRepository.findOne({
      where: { idCategory: income.idCategory },
    });

    return this.mapToView(income, installments, category?.name ?? "");
  }

  async updateStatus(
    idUsers: string,
    payload: UpdateIncomeStatusPayload,
  ): Promise<IncomeView> {
    return this.dataSource.transaction(async (manager) => {
      const incomeRepository = manager.getRepository(IncomeEntity);
      const installmentRepository = manager.getRepository(
        IncomeInstallmentEntity,
      );

      const income = await incomeRepository.findOne({
        where: { idIncome: payload.idIncome, idUsers },
      });

      if (!income) {
        throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
      }

      const installments = await installmentRepository.find({
        where: { idIncome: income.idIncome },
        order: { installmentNumber: "ASC" },
      });

      if (
        payload.status === IncomeStatus.PENDING ||
        payload.status === IncomeStatus.OVERDUE
      ) {
        for (const installment of installments) {
          const amountDue = Number(installment.amountDue);
          const amountReceived = Number(installment.amountReceived);
          if (amountReceived < amountDue) {
            installment.status = payload.status;
          }
        }
      }

      await installmentRepository.save(installments);

      income.status = payload.status;
      income.receivedAt =
        payload.status === IncomeStatus.RECEIVED ? new Date() : undefined;
      const savedIncome = await incomeRepository.save(income);

      const category = await manager.getRepository(CategoryEntity).findOne({
        where: { idCategory: savedIncome.idCategory },
      });

      return this.mapToView(
        savedIncome,
        installments,
        category?.name ?? "",
      );
    });
  }

  async updateDetails(
    idUsers: string,
    payload: UpdateIncomeDetailsPayload,
  ): Promise<IncomeView> {
    return this.dataSource.transaction(async (manager) => {
      const incomeRepository = manager.getRepository(IncomeEntity);
      const installmentRepository = manager.getRepository(
        IncomeInstallmentEntity,
      );

      const income = await incomeRepository.findOne({
        where: { idIncome: payload.idIncome, idUsers },
      });

      if (!income) {
        throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
      }

      if (payload.title !== undefined) {
        income.title = payload.title;
      }
      if (payload.description !== undefined) {
        income.description = payload.description;
      }
      if (payload.idCategory !== undefined) {
        income.idCategory = payload.idCategory;
      }
      if (payload.incomeType !== undefined) {
        income.incomeType = payload.incomeType;
      }
      if (payload.isRecurring !== undefined) {
        income.isRecurring = payload.isRecurring;
      }

      const installments = await installmentRepository.find({
        where: { idIncome: income.idIncome },
        order: { installmentNumber: "ASC" },
      });

      if (payload.dueDate !== undefined) {
        if (income.hasInstallments) {
          throw AppException.from(
            APP_ERRORS.incomes.dueDateNotEditableForInstallments,
            undefined,
          );
        }

        income.dueDate = payload.dueDate;

        if (installments[0]) {
          installments[0].dueDate = payload.dueDate;
          await installmentRepository.save(installments[0]);
        }
      }

      if (payload.totalAmount !== undefined) {
        if (income.hasInstallments) {
          throw AppException.from(
            APP_ERRORS.incomes.totalAmountNotEditableForInstallments,
            undefined,
          );
        }

        income.totalAmount = payload.totalAmount.toFixed(2);

        if (installments[0]) {
          installments[0].amountDue = payload.totalAmount.toFixed(2);
          await installmentRepository.save(installments[0]);
        }
      }

      const savedIncome = await incomeRepository.save(income);

      const category = await manager.getRepository(CategoryEntity).findOne({
        where: { idCategory: savedIncome.idCategory },
      });

      return this.mapToView(
        savedIncome,
        installments,
        category?.name ?? "",
      );
    });
  }

  async delete(idUsers: string, idIncome: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const incomeRepository = manager.getRepository(IncomeEntity);

      const income = await incomeRepository.findOne({
        where: { idIncome, idUsers },
      });

      if (!income) {
        throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
      }

      // Neither the installment nor the receipt table declares a DB-level
      // foreign key relation (they're plain idtb_incomes columns), so
      // nothing cascades automatically — every related row must be removed
      // explicitly before the income itself, in the same transaction.
      await manager
        .getRepository(IncomeReceiptEntity)
        .delete({ idIncome: income.idIncome });
      await manager
        .getRepository(IncomeInstallmentEntity)
        .delete({ idIncome: income.idIncome });
      await incomeRepository.delete({ idIncome: income.idIncome });
    });
  }

  async listByUser(
    idUsers: string,
    filters?: ListIncomesFilters,
  ): Promise<{ records: IncomeView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const qb = this.incomeRepository
      .createQueryBuilder("income")
      .where("income.idUsers = :idUsers", { idUsers })
      .orderBy("income.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.status) {
      qb.andWhere("income.status = :status", { status: filters.status });
    }

    if (filters?.incomeType) {
      qb.andWhere("income.incomeType = :incomeType", {
        incomeType: filters.incomeType,
      });
    }

    if (filters?.idCategory) {
      qb.andWhere("income.idCategory = :idCategory", {
        idCategory: filters.idCategory,
      });
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      const existsInstallmentInRange = this.installmentRepository
        .createQueryBuilder("ii")
        .select("1")
        .where("ii.idIncome = CAST(income.idIncome AS varchar)");

      if (filters.dueDateFrom) {
        existsInstallmentInRange.andWhere("ii.dueDate >= :dueDateFrom", {
          dueDateFrom: toDateOnlyString(filters.dueDateFrom),
        });
      }

      if (filters.dueDateTo) {
        existsInstallmentInRange.andWhere("ii.dueDate <= :dueDateTo", {
          dueDateTo: toDateOnlyString(filters.dueDateTo),
        });
      }

      qb.andWhere(
        `EXISTS (${existsInstallmentInRange.getQuery()})`,
      ).setParameters(existsInstallmentInRange.getParameters());
    }

    const [rows, total] = await qb.getManyAndCount();

    const ids = rows.map((row) => row.idIncome);
    const installments = ids.length
      ? await this.installmentRepository.find({
          where: { idIncome: In(ids) },
          order: { installmentNumber: "ASC" },
        })
      : [];

    const installmentsByIncome = new Map<string, IncomeInstallmentEntity[]>();
    for (const installment of installments) {
      const current = installmentsByIncome.get(installment.idIncome) ?? [];
      current.push(installment);
      installmentsByIncome.set(installment.idIncome, current);
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

    return {
      records: rows.map((row) =>
        this.mapToView(
          row,
          installmentsByIncome.get(row.idIncome) ?? [],
          categoryById.get(row.idCategory) ?? "",
        ),
      ),
      total,
    };
  }

  private computeEndDate(
    entity: IncomeEntity,
    installments: IncomeInstallmentEntity[],
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
    entity: IncomeInstallmentEntity,
  ): IncomeInstallmentView {
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

  private mapToView(
    entity: IncomeEntity,
    installments: IncomeInstallmentEntity[],
    category: string,
  ): IncomeView {
    return {
      idIncome: entity.idIncome,
      idUsers: entity.idUsers,
      idCategory: entity.idCategory,
      category,
      title: entity.title,
      description: entity.description,
      incomeType: entity.incomeType,
      totalAmount: Number(entity.totalAmount),
      dueDate: entity.dueDate,
      endDate: this.computeEndDate(entity, installments),
      startDate: entity.startDate,
      hasInstallments: entity.hasInstallments,
      installmentCount: entity.installmentCount,
      isRecurring: entity.isRecurring,
      status: entity.status,
      receivedAt: entity.receivedAt,
      installments: installments.map((installment) =>
        this.mapInstallmentToView(installment),
      ),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
