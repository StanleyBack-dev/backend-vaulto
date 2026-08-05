import type { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

export type UpdateCategoryCommand = {
  idCategory: string;
  name: string;
  type?: CategoryType;
  status: boolean;
};
