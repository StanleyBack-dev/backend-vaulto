import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from "@/modules/categories/application/ports/category-repository.port";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
  type IncomeView,
} from "@/modules/incomes/application/ports/income-repository.port";
import { UpdateIncomeDetailsCommand } from "@/modules/incomes/application/dto/update/update-income-details.command";

@Injectable()
export class UpdateIncomeDetailsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateIncomeDetailsCommand,
  ): Promise<IncomeView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    if (
      command.expectedAmount !== undefined &&
      (!Number.isFinite(command.expectedAmount) || command.expectedAmount <= 0)
    ) {
      throw AppException.from(APP_ERRORS.incomes.invalidAmount, undefined);
    }

    let categoryName: string | undefined;

    if (command.idCategory) {
      const category = await this.categoryRepository.findById(
        userId,
        command.idCategory,
      );

      if (!category || !category.status) {
        throw AppException.from(
          APP_ERRORS.incomes.categoryNotFound,
          undefined,
        );
      }
      if (category.type !== CategoryType.INCOME) {
        throw AppException.from(
          APP_ERRORS.incomes.categoryNotIncomeType,
          undefined,
        );
      }

      categoryName = category.name;
    }

    return this.incomeRepository.updateDetails(userId, {
      idIncome: command.idIncome,
      title: command.title,
      description: command.description,
      idCategory: command.idCategory,
      category: categoryName,
      incomeType: command.incomeType,
      expectedAmount: command.expectedAmount,
      expectedDate: command.expectedDate,
      receivedAmount: command.receivedAmount,
      receivedAt: command.receivedAt,
      isRecurring: command.isRecurring,
    });
  }
}
