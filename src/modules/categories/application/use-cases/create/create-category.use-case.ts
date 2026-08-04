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
import type { CreateCategoryCommand } from "@/modules/categories/application/dto/create/create-category.command";

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: CreateCategoryCommand,
  ): Promise<CategoryView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    const normalizedName = command.name.trim();
    if (!normalizedName) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "name",
      });
    }

    const existing = await this.categoryRepository.findByName(
      userId,
      normalizedName,
    );
    if (existing) {
      throw AppException.from(APP_ERRORS.categories.duplicatedName, undefined);
    }

    return this.categoryRepository.create({
      idUsers: userId,
      name: normalizedName,
      status: command.status ?? true,
    });
  }
}
