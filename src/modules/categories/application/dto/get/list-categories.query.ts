import type { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

export type ListCategoriesQuery = {
  page?: number;
  limit?: number;
  status?: boolean;
  type?: CategoryType;
};
