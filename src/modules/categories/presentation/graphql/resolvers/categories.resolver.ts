import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateCategoryUseCase } from "@/modules/categories/application/use-cases/create/create-category.use-case";
import { GetCategoryByIdUseCase } from "@/modules/categories/application/use-cases/get/get-category-by-id.use-case";
import { ListCategoriesUseCase } from "@/modules/categories/application/use-cases/get/list-categories.use-case";
import { UpdateCategoryUseCase } from "@/modules/categories/application/use-cases/update/update-category.use-case";
import { CreateCategoryInputDto } from "@/modules/categories/presentation/graphql/dtos/create/create-category-input.dto";
import { CreateCategoryMutationResponseDto } from "@/modules/categories/presentation/graphql/dtos/create/create-category-mutation-response.dto";
import { CategoryResponseDto } from "@/modules/categories/presentation/graphql/dtos/get/category-response.dto";
import { GetCategoryByIdInputDto } from "@/modules/categories/presentation/graphql/dtos/get/get-category-by-id-input.dto";
import { ListCategoriesInputDto } from "@/modules/categories/presentation/graphql/dtos/get/list-categories-input.dto";
import { ListCategoriesResponseDto } from "@/modules/categories/presentation/graphql/dtos/get/list-categories-response.dto";
import { UpdateCategoryInputDto } from "@/modules/categories/presentation/graphql/dtos/update/update-category-input.dto";
import { UpdateCategoryMutationResponseDto } from "@/modules/categories/presentation/graphql/dtos/update/update-category-mutation-response.dto";

@Resolver()
export class CategoriesResolver {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
  ) {}

  @Query(() => ListCategoriesResponseDto, { name: "getMyCategories" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListCategoriesInputDto,
  ) {
    const result = await this.listCategoriesUseCase.execute(
      user.idUsers,
      input,
    );

    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => CategoryResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.categories.listed,
    );
  }

  @Query(() => CategoryResponseDto, { name: "getCategoryById" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getCategoryById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCategoryByIdInputDto,
  ) {
    const category = await this.getCategoryByIdUseCase.execute(user.idUsers, {
      idCategory: input.idCategory,
    });

    return CategoryResponseDto.fromView(category);
  }

  @Mutation(() => CreateCategoryMutationResponseDto, { name: "createCategory" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateCategoryInputDto,
  ) {
    const created = await this.createCategoryUseCase.execute(user.idUsers, {
      name: input.name,
      status: input.status,
    });

    return buildDataResponse(
      CategoryResponseDto.fromView(created),
      RESPONSE_MESSAGES.categories.created,
    );
  }

  @Mutation(() => UpdateCategoryMutationResponseDto, { name: "updateCategory" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateCategoryInputDto,
  ) {
    const updated = await this.updateCategoryUseCase.execute(user.idUsers, {
      idCategory: input.idCategory,
      name: input.name,
      status: input.status,
    });

    return buildDataResponse(
      CategoryResponseDto.fromView(updated),
      RESPONSE_MESSAGES.categories.updated,
    );
  }
}
