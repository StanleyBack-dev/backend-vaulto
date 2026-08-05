import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
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
import { CreateIncomeCommand } from "@/modules/incomes/application/dto/create/create-income.command";
import { Income } from "@/modules/incomes/domain/entities/income.entity";

@Injectable()
export class CreateIncomeUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: CreateIncomeCommand,
  ): Promise<IncomeView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    const category = await this.categoryRepository.findById(
      userId,
      command.idCategory,
    );
    if (!category || !category.status) {
      throw AppException.from(APP_ERRORS.incomes.categoryNotFound, undefined);
    }
    if (category.type !== CategoryType.INCOME) {
      throw AppException.from(
        APP_ERRORS.incomes.categoryNotIncomeType,
        undefined,
      );
    }

    const income = Income.create({
      idUsers: userId,
      idCategory: command.idCategory,
      title: command.title,
      description: command.description,
      incomeType: command.incomeType,
      expectedAmount: command.expectedAmount,
      expectedDate: command.expectedDate,
      isRecurring: command.isRecurring,
    });

    const primitive = income.toPrimitive();

    return this.incomeRepository.create({
      idUsers: primitive.idUsers,
      idCategory: primitive.idCategory,
      category: category.name,
      title: primitive.title,
      description: primitive.description,
      incomeType: primitive.incomeType,
      expectedAmount: primitive.expectedAmount,
      expectedDate: primitive.expectedDate,
      receivedAmount: primitive.receivedAmount ?? 0,
      receivedAt: primitive.receivedAt,
      isRecurring: primitive.isRecurring ?? false,
      status: primitive.status!,
    });
  }
}
