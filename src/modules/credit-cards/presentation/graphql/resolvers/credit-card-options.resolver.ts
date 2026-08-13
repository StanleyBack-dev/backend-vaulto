import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildPaginatedListResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ListCreditCardsUseCase } from "@/modules/credit-cards/application/use-cases/get/list-credit-cards.use-case";
import { CreditCardResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/credit-card-response.dto";
import { ListCreditCardsInputDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/list-credit-cards-input.dto";
import { ListCreditCardsResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/list-credit-cards-response.dto";

/**
 * Lightweight, non-page-gated credit card listing used as a picker/dropdown
 * data source by other features (debt forms). Kept separate from
 * CreditCardsResolver so the "Cartões de crédito" page's own
 * @RequirePageAccess gate doesn't block callers that only need options.
 */
@Resolver()
export class CreditCardOptionsResolver {
  constructor(
    private readonly listCreditCardsUseCase: ListCreditCardsUseCase,
  ) {}

  @Query(() => ListCreditCardsResponseDto, { name: "getMyCreditCardOptions" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyCreditCardOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListCreditCardsInputDto,
  ) {
    const result = await this.listCreditCardsUseCase.execute(
      user.idUsers,
      input,
    );

    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => CreditCardResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.creditCards.listed,
    );
  }
}
