import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import {
  CREDIT_CARD_REPOSITORY,
  type CreditCardRepositoryPort,
  type CreditCardView,
} from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import type { CreateCreditCardCommand } from "@/modules/credit-cards/application/dto/create/create-credit-card.command";

@Injectable()
export class CreateCreditCardUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: CreditCardRepositoryPort,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async execute(
    userId: string,
    command: CreateCreditCardCommand,
  ): Promise<CreditCardView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    const { total: currentCreditCardsCount } =
      await this.creditCardRepository.listByUser(userId, { limit: 1 });
    await this.planLimitsService.assertCanCreate(
      userId,
      PlanLimitedResource.CREDIT_CARDS,
      currentCreditCardsCount,
    );

    const normalizedName = command.name.trim();
    if (!normalizedName) {
      throw AppException.from(APP_ERRORS.validation.missingField, {
        field: "name",
      });
    }

    if (!Number.isFinite(command.creditLimit) || command.creditLimit <= 0) {
      throw AppException.from(APP_ERRORS.creditCards.invalidLimit, undefined);
    }

    if (
      !Number.isInteger(command.dueDay) ||
      command.dueDay < 1 ||
      command.dueDay > 31
    ) {
      throw AppException.from(APP_ERRORS.creditCards.invalidDueDay, undefined);
    }

    if (
      !Number.isInteger(command.closingDay) ||
      command.closingDay < 1 ||
      command.closingDay > 31
    ) {
      throw AppException.from(
        APP_ERRORS.creditCards.invalidClosingDay,
        undefined,
      );
    }

    const existing = await this.creditCardRepository.findByName(
      userId,
      normalizedName,
    );
    if (existing) {
      throw AppException.from(APP_ERRORS.creditCards.duplicatedName, undefined);
    }

    return this.creditCardRepository.create({
      idUsers: userId,
      name: normalizedName,
      creditLimit: command.creditLimit,
      dueDay: command.dueDay,
      closingDay: command.closingDay,
      status: command.status ?? true,
    });
  }
}
