import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
  type CategoryView,
} from "@/modules/categories/application/ports/category-repository.port";
import type { GetCategoryByIdQuery } from "@/modules/categories/application/dto/get/get-category-by-id.query";

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query: GetCategoryByIdQuery,
  ): Promise<CategoryView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    const category = await this.categoryRepository.findById(
      userId,
      query.idCategory,
    );
    if (!category) {
      throw AppException.from(APP_ERRORS.categories.notFound, undefined);
    }

    return category;
  }
}
