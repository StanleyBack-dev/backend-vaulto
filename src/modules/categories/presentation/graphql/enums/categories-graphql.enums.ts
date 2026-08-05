import { registerEnumType } from "@nestjs/graphql";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

registerEnumType(CategoryType, {
  name: "CategoryType",
});
