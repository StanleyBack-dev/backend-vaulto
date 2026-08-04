import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
  type CategoryView,
} from "@/modules/categories/application/ports/category-repository.port";
import type { ListCategoriesQuery } from "@/modules/categories/application/dto/get/list-categories.query";

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: ListCategoriesQuery,
  ): Promise<PaginatedResult<CategoryView>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    const { page, limit } = resolvePagination(query?.page, query?.limit);
    const { records, total } = await this.categoryRepository.listByUser(
      userId,
      {
        ...query,
        page,
        limit,
      },
    );

    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }
}
