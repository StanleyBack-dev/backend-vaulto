import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  CREDIT_CARD_REPOSITORY,
  type CreditCardRepositoryPort,
  type CreditCardView,
} from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import type { UpdateCreditCardCommand } from "@/modules/credit-cards/application/dto/update/update-credit-card.command";

@Injectable()
export class UpdateCreditCardUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: CreditCardRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateCreditCardCommand,
  ): Promise<CreditCardView> {
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

    const current = await this.creditCardRepository.findById(
      userId,
      command.idCreditCard,
    );
    if (!current) {
      throw AppException.from(APP_ERRORS.creditCards.notFound, undefined);
    }

    const existing = await this.creditCardRepository.findByName(
      userId,
      normalizedName,
    );
    if (existing && existing.idCreditCard !== command.idCreditCard) {
      throw AppException.from(APP_ERRORS.creditCards.duplicatedName, undefined);
    }

    return this.creditCardRepository.update({
      idUsers: userId,
      idCreditCard: command.idCreditCard,
      name: normalizedName,
      creditLimit: command.creditLimit,
      dueDay: command.dueDay,
      closingDay: command.closingDay,
      status: command.status,
    });
  }
}
