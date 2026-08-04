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
import type { GetCreditCardByIdQuery } from "@/modules/credit-cards/application/dto/get/get-credit-card-by-id.query";

@Injectable()
export class GetCreditCardByIdUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: CreditCardRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query: GetCreditCardByIdQuery,
  ): Promise<CreditCardView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    const creditCard = await this.creditCardRepository.findById(
      userId,
      query.idCreditCard,
    );
    if (!creditCard) {
      throw AppException.from(APP_ERRORS.creditCards.notFound, undefined);
    }

    return creditCard;
  }
}
