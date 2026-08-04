import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import { CategoryResponseDto } from "@/modules/categories/presentation/graphql/dtos/get/category-response.dto";

export const CreateCategoryMutationResponseDto = createDataResponseDto(
  CategoryResponseDto,
  "CreateCategoryMutationResponseDto",
);
