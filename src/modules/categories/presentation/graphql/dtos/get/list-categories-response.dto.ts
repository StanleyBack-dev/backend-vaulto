import { createListResponseDto } from "@/common/responses/factories/create-list-response.dto";
import { CategoryResponseDto } from "@/modules/categories/presentation/graphql/dtos/get/category-response.dto";

export const ListCategoriesResponseDto = createListResponseDto(
  CategoryResponseDto,
  "ListCategoriesResponseDto",
);
