import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  CATEGORY_REPOSITORY,
  type CategoryRepositoryPort,
} from "@/modules/categories/application/ports/category-repository.port";
import {
  CREDIT_CARD_REPOSITORY,
  type CreditCardRepositoryPort,
} from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import { CreditCardDueDateService } from "@/modules/credit-cards/domain/services/credit-card-due-date.service";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import {
  DEBT_REPOSITORY,
  type CreateDebtInstallmentPayload,
  type CreateDebtPayload,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { CreateDebtCommand } from "@/modules/debts/application/dto/create/create-debt.command";
import { Debt } from "@/modules/debts/domain/entities/debt.entity";
import { DebtInstallmentScheduleService } from "@/modules/debts/domain/services/debt-installment-schedule.service";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

@Injectable()
export class CreateDebtUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepositoryPort,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: CreditCardRepositoryPort,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async execute(userId: string, command: CreateDebtCommand): Promise<DebtView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    const { total: currentDebtsCount } = await this.debtRepository.listByUser(
      userId,
      { limit: 1 },
    );
    await this.planLimitsService.assertCanCreate(
      userId,
      PlanLimitedResource.DEBTS,
      currentDebtsCount,
    );

    const category = await this.categoryRepository.findById(
      userId,
      command.idCategory,
    );
    if (!category || !category.status) {
      throw AppException.from(APP_ERRORS.categories.notFound, undefined);
    }

    // A debt linked to a credit card always follows the bank's own billing
    // cycle: the due date is derived from the card, never typed manually,
    // and the purchase must fit within what's still available on the card —
    // exactly like an actual credit card transaction.
    let creditCardName: string | undefined;
    let cardDerivedDueDate: Date | undefined;

    if (command.idCreditCard) {
      const creditCard = await this.creditCardRepository.findById(
        userId,
        command.idCreditCard,
      );
      if (!creditCard) {
        throw AppException.from(APP_ERRORS.creditCards.notFound, undefined);
      }
      if (!creditCard.status) {
        throw AppException.from(APP_ERRORS.creditCards.inactiveCard, undefined);
      }
      if ((command.totalAmount ?? 0) > creditCard.availableLimit) {
        throw AppException.from(
          APP_ERRORS.creditCards.insufficientLimit,
          undefined,
        );
      }

      // The billing cycle a purchase falls into depends on when it actually
      // happened, not on when it's being registered — a backdated debt
      // (e.g. entered weeks after the purchase) must still land on the due
      // date that purchase would have gotten back then, so this can never
      // silently default to "today".
      if (!command.acquiredAt) {
        throw AppException.from(
          APP_ERRORS.creditCards.acquiredAtRequiredForCreditCard,
          undefined,
        );
      }

      creditCardName = creditCard.name;
      cardDerivedDueDate = CreditCardDueDateService.computeNextDueDate(
        creditCard.dueDay,
        creditCard.closingDay,
        command.acquiredAt,
      );
    }

    const debt = Debt.create({
      idUsers: userId,
      idCategory: command.idCategory,
      title: command.title,
      description: command.description,
      debtType: command.debtType,
      totalAmount: command.totalAmount,
      installmentAmount: command.installmentAmount,
      dueDate: cardDerivedDueDate ?? command.dueDate,
      acquiredAt: command.acquiredAt,
      startDate: cardDerivedDueDate ?? command.dueDate ?? new Date(),
      hasInstallments: command.hasInstallments,
      installmentCount: command.installmentCount,
    });

    const primitive = debt.toPrimitive();
    const payload: CreateDebtPayload = {
      idUsers: primitive.idUsers,
      idCategory: primitive.idCategory,
      title: primitive.title,
      category: category.name,
      idCreditCard: command.idCreditCard,
      creditCard: creditCardName,
      description: primitive.description,
      debtType: primitive.debtType,
      totalAmount: primitive.totalAmount ?? 0,
      dueDate: primitive.dueDate,
      acquiredAt: primitive.acquiredAt,
      startDate: primitive.startDate,
      hasInstallments: primitive.hasInstallments,
      installmentCount: primitive.installmentCount ?? 1,
      status: primitive.status ?? DebtStatus.OPEN,
    };
    const installments = DebtInstallmentScheduleService.build({
      totalAmount: payload.totalAmount,
      installmentCount: payload.installmentCount ?? 1,
      startDate: payload.startDate,
    }).map(
      (installment) =>
        ({
          ...installment.toPrimitive(),
          status: DebtStatus.OPEN,
        }) as CreateDebtInstallmentPayload,
    );

    return this.debtRepository.create(payload, installments);
  }
}
