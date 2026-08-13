import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildPaginatedListResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ListCategoriesUseCase } from "@/modules/categories/application/use-cases/get/list-categories.use-case";
import { CategoryResponseDto } from "@/modules/categories/presentation/graphql/dtos/get/category-response.dto";
import { ListCategoriesInputDto } from "@/modules/categories/presentation/graphql/dtos/get/list-categories-input.dto";
import { ListCategoriesResponseDto } from "@/modules/categories/presentation/graphql/dtos/get/list-categories-response.dto";

/**
 * Lightweight, non-page-gated category listing used as a picker/dropdown data
 * source by other features (debt/income forms). Kept separate from
 * CategoriesResolver so the "Categorias" page's own @RequirePageAccess gate
 * doesn't block callers that only need category options, not the management page.
 */
@Resolver()
export class CategoryOptionsResolver {
  constructor(private readonly listCategoriesUseCase: ListCategoriesUseCase) {}

  @Query(() => ListCategoriesResponseDto, { name: "getMyCategoryOptions" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyCategoryOptions(
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
}
