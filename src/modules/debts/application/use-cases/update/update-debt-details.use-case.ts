import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from "@/modules/categories/application/ports/category-repository.port";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { UpdateDebtDetailsCommand } from "@/modules/debts/application/dto/update/update-debt-details.command";

@Injectable()
export class UpdateDebtDetailsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateDebtDetailsCommand,
  ): Promise<DebtView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    if (
      command.totalAmount !== undefined &&
      (!Number.isFinite(command.totalAmount) || command.totalAmount <= 0)
    ) {
      throw AppException.from(APP_ERRORS.debts.invalidAmount, undefined);
    }

    let categoryName: string | undefined;

    if (command.idCategory) {
      const category = await this.categoryRepository.findById(
        userId,
        command.idCategory,
      );

      if (!category || !category.status) {
        throw AppException.from(APP_ERRORS.categories.notFound, undefined);
      }

      categoryName = category.name;
    }

    return this.debtRepository.updateDetails(userId, {
      idDebt: command.idDebt,
      title: command.title,
      description: command.description,
      idCategory: command.idCategory,
      category: categoryName,
      debtType: command.debtType,
      acquiredAt: command.acquiredAt,
      dueDate: command.dueDate,
      totalAmount: command.totalAmount,
    });
  }
}
