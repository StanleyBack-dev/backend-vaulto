import type { CreateCategoryCommand } from "@/modules/categories/application/dto/create/create-category.command";
import type { ListCategoriesQuery } from "@/modules/categories/application/dto/get/list-categories.query";
import type { UpdateCategoryCommand } from "@/modules/categories/application/dto/update/update-category.command";

export type CategoryView = {
  idCategory: string;
  idUsers: string;
  name: string;
  status: boolean;
  inactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCategoryPayload = CreateCategoryCommand & {
  idUsers: string;
};

export type UpdateCategoryPayload = UpdateCategoryCommand & {
  idUsers: string;
};

export interface CategoryRepositoryPort {
  create(payload: CreateCategoryPayload): Promise<CategoryView>;
  update(payload: UpdateCategoryPayload): Promise<CategoryView>;
  findById(idUsers: string, idCategory: string): Promise<CategoryView | null>;
  findByName(idUsers: string, name: string): Promise<CategoryView | null>;
  listByUser(
    idUsers: string,
    query?: ListCategoriesQuery,
  ): Promise<{ records: CategoryView[]; total: number }>;
}

export const CATEGORY_REPOSITORY = Symbol("CATEGORY_REPOSITORY");
