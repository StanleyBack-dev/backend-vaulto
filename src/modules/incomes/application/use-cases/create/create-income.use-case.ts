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
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import {
  INCOME_REPOSITORY,
  type CreateIncomeInstallmentPayload,
  type CreateIncomePayload,
  type IncomeRepositoryPort,
  type IncomeView,
} from "@/modules/incomes/application/ports/income-repository.port";
import { CreateIncomeCommand } from "@/modules/incomes/application/dto/create/create-income.command";
import { Income } from "@/modules/incomes/domain/entities/income.entity";
import { IncomeInstallmentScheduleService } from "@/modules/incomes/domain/services/income-installment-schedule.service";

@Injectable()
export class CreateIncomeUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async execute(
    userId: string,
    command: CreateIncomeCommand,
  ): Promise<IncomeView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    const { total: currentIncomesCount } =
      await this.incomeRepository.listByUser(userId, { limit: 1 });
    await this.planLimitsService.assertCanCreate(
      userId,
      PlanLimitedResource.INCOMES,
      currentIncomesCount,
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
      totalAmount: command.totalAmount,
      installmentAmount: command.installmentAmount,
      dueDate: command.dueDate,
      startDate: command.dueDate ?? new Date(),
      hasInstallments: command.hasInstallments,
      installmentCount: command.installmentCount,
      isRecurring: command.isRecurring,
    });

    const primitive = income.toPrimitive();
    const payload: CreateIncomePayload = {
      idUsers: primitive.idUsers,
      idCategory: primitive.idCategory,
      category: category.name,
      title: primitive.title,
      description: primitive.description,
      incomeType: primitive.incomeType,
      totalAmount: primitive.totalAmount ?? 0,
      dueDate: primitive.dueDate,
      startDate: primitive.startDate,
      hasInstallments: primitive.hasInstallments,
      installmentCount: primitive.installmentCount ?? 1,
      isRecurring: primitive.isRecurring ?? false,
      status: primitive.status!,
    };

    const installments: CreateIncomeInstallmentPayload[] =
      IncomeInstallmentScheduleService.build({
        totalAmount: payload.totalAmount,
        installmentCount: payload.installmentCount ?? 1,
        startDate: payload.startDate,
      }).map(
        (installment) =>
          ({
            ...installment.toPrimitive(),
            status: primitive.status!,
          }) as CreateIncomeInstallmentPayload,
      );

    return this.incomeRepository.create(payload, installments);
  }
}
