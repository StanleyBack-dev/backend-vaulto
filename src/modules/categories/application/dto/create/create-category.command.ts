import type { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

export type CreateCategoryCommand = {
  name: string;
  type?: CategoryType;
  status?: boolean;
};
