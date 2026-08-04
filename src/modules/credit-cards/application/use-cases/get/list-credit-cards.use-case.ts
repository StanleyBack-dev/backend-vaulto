import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  CREDIT_CARD_REPOSITORY,
  type CreditCardRepositoryPort,
  type CreditCardView,
} from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import type { ListCreditCardsQuery } from "@/modules/credit-cards/application/dto/get/list-credit-cards.query";

@Injectable()
export class ListCreditCardsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: CreditCardRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: ListCreditCardsQuery,
  ): Promise<PaginatedResult<CreditCardView>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    const { page, limit } = resolvePagination(query?.page, query?.limit);
    const { records, total } = await this.creditCardRepository.listByUser(
      userId,
      {
        ...query,
        page,
        limit,
      },
    );

    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }
}
