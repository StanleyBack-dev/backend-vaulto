import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { toDateOnlyString } from "@/common/utils/date.util";
import {
  type CreateIncomePayload,
  type IncomeRepositoryPort,
  type IncomeView,
  type ListIncomesFilters,
  type UpdateIncomeDetailsPayload,
  type UpdateIncomeStatusPayload,
} from "@/modules/incomes/application/ports/income-repository.port";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";

@Injectable()
export class IncomeTypeormRepository implements IncomeRepositoryPort {
  constructor(
    @InjectRepository(IncomeEntity)
    private readonly incomeRepository: Repository<IncomeEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(payload: CreateIncomePayload): Promise<IncomeView> {
    const created = this.incomeRepository.create({
      idUsers: payload.idUsers,
      idCategory: payload.idCategory,
      title: payload.title,
      description: payload.description,
      incomeType: payload.incomeType,
      expectedAmount: payload.expectedAmount.toFixed(2),
      expectedDate: payload.expectedDate,
      receivedAmount: payload.receivedAmount.toFixed(2),
      receivedAt: payload.receivedAt,
      isRecurring: payload.isRecurring,
      status: payload.status,
    });

    const saved = await this.incomeRepository.save(created);
    return this.mapToView(saved, payload.category);
  }

  async findById(idUsers: string, idIncome: string): Promise<IncomeView> {
    const income = await this.incomeRepository.findOne({
      where: { idIncome, idUsers },
    });

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    const category = await this.findCategoryName(income.idCategory);
    return this.mapToView(income, category);
  }

  async updateDetails(
    idUsers: string,
    payload: UpdateIncomeDetailsPayload,
  ): Promise<IncomeView> {
    const income = await this.incomeRepository.findOne({
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
    if (payload.expectedAmount !== undefined) {
      income.expectedAmount = payload.expectedAmount.toFixed(2);
    }
    if (payload.expectedDate !== undefined) {
      income.expectedDate = payload.expectedDate;
    }
    if (payload.receivedAt !== undefined) {
      income.receivedAt = payload.receivedAt;
    }

    if (payload.receivedAmount !== undefined) {
      income.receivedAmount = payload.receivedAmount.toFixed(2);

      // RECEIVED and PARTIALLY_RECEIVED are derived from how the received
      // amount compares to what's expected — this is the income module's
      // equivalent of a debt's payment registration triggering its status,
      // just folded into the same details update since there's no separate
      // receipts sub-table.
      const expected = Number(income.expectedAmount);
      const received = Number(income.receivedAmount);

      if (received <= 0) {
        income.status = IncomeStatus.PENDING;
      } else if (received >= expected) {
        income.status = IncomeStatus.RECEIVED;
      } else {
        income.status = IncomeStatus.PARTIALLY_RECEIVED;
      }
    }

    const saved = await this.incomeRepository.save(income);
    const category = await this.findCategoryName(saved.idCategory);
    return this.mapToView(saved, category);
  }

  async updateStatus(
    idUsers: string,
    payload: UpdateIncomeStatusPayload,
  ): Promise<IncomeView> {
    const income = await this.incomeRepository.findOne({
      where: { idIncome: payload.idIncome, idUsers },
    });

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    income.status = payload.status;

    const saved = await this.incomeRepository.save(income);
    const category = await this.findCategoryName(saved.idCategory);
    return this.mapToView(saved, category);
  }

  async delete(idUsers: string, idIncome: string): Promise<void> {
    const income = await this.incomeRepository.findOne({
      where: { idIncome, idUsers },
    });

    if (!income) {
      throw AppException.from(APP_ERRORS.incomes.notFound, undefined);
    }

    await this.incomeRepository.delete({ idIncome: income.idIncome });
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
      .orderBy("income.expectedDate", "ASC")
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

    if (filters?.expectedDateFrom) {
      qb.andWhere("income.expectedDate >= :expectedDateFrom", {
        expectedDateFrom: toDateOnlyString(filters.expectedDateFrom),
      });
    }

    if (filters?.expectedDateTo) {
      qb.andWhere("income.expectedDate <= :expectedDateTo", {
        expectedDateTo: toDateOnlyString(filters.expectedDateTo),
      });
    }

    const [rows, total] = await qb.getManyAndCount();

    const categoryIds = Array.from(
      new Set(rows.map((row) => row.idCategory)),
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
        this.mapToView(row, categoryById.get(row.idCategory) ?? ""),
      ),
      total,
    };
  }

  private async findCategoryName(idCategory: string): Promise<string> {
    const category = await this.categoryRepository.findOne({
      where: { idCategory },
    });

    return category?.name ?? "";
  }

  private mapToView(entity: IncomeEntity, category: string): IncomeView {
    return {
      idIncome: entity.idIncome,
      idUsers: entity.idUsers,
      idCategory: entity.idCategory,
      category,
      title: entity.title,
      description: entity.description,
      incomeType: entity.incomeType,
      expectedAmount: Number(entity.expectedAmount),
      expectedDate: entity.expectedDate,
      receivedAmount: Number(entity.receivedAmount),
      receivedAt: entity.receivedAt,
      isRecurring: entity.isRecurring,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
