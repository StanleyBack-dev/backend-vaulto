import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import type {
  CategoryRepositoryPort,
  CategoryView,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/modules/categories/application/ports/category-repository.port";
import type { ListCategoriesQuery } from "@/modules/categories/application/dto/get/list-categories.query";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";

@Injectable()
export class CategoryTypeormRepository implements CategoryRepositoryPort {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>,
  ) {}

  async create(payload: CreateCategoryPayload): Promise<CategoryView> {
    const created = this.repository.create({
      idUsers: payload.idUsers,
      name: payload.name,
      status: payload.status ?? true,
      inactivatedAt: payload.status === false ? new Date() : undefined,
    });

    const saved = await this.repository.save(created);
    return this.mapToView(saved);
  }

  async update(payload: UpdateCategoryPayload): Promise<CategoryView> {
    const current = await this.repository.findOne({
      where: { idUsers: payload.idUsers, idCategory: payload.idCategory },
    });
    if (!current) {
      throw new Error("Category not found");
    }

    current.name = payload.name;
    current.status = payload.status;
    current.inactivatedAt = payload.status ? undefined : new Date();

    const saved = await this.repository.save(current);
    return this.mapToView(saved);
  }

  async findById(
    idUsers: string,
    idCategory: string,
  ): Promise<CategoryView | null> {
    const row = await this.repository.findOne({
      where: { idUsers, idCategory },
    });

    return row ? this.mapToView(row) : null;
  }

  async findByName(
    idUsers: string,
    name: string,
  ): Promise<CategoryView | null> {
    const row = await this.repository.findOne({
      where: { idUsers, name: ILike(name.trim()) },
    });

    return row ? this.mapToView(row) : null;
  }

  async listByUser(
    idUsers: string,
    query?: ListCategoriesQuery,
  ): Promise<{ records: CategoryView[]; total: number }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const qb = this.repository
      .createQueryBuilder("category")
      .where("category.idUsers = :idUsers", { idUsers })
      .orderBy("category.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (typeof query?.status === "boolean") {
      qb.andWhere("category.status = :status", { status: query.status });
    }

    const [rows, total] = await qb.getManyAndCount();
    return { records: rows.map((row) => this.mapToView(row)), total };
  }

  private mapToView(entity: CategoryEntity): CategoryView {
    return {
      idCategory: entity.idCategory,
      idUsers: entity.idUsers,
      name: entity.name,
      status: entity.status,
      inactivatedAt: entity.inactivatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
