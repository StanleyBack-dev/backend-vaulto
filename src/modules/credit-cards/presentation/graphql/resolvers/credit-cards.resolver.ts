import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/create/create-credit-card.use-case";
import { GetCreditCardByIdUseCase } from "@/modules/credit-cards/application/use-cases/get/get-credit-card-by-id.use-case";
import { ListCreditCardsUseCase } from "@/modules/credit-cards/application/use-cases/get/list-credit-cards.use-case";
import { UpdateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/update/update-credit-card.use-case";
import { CreateCreditCardInputDto } from "@/modules/credit-cards/presentation/graphql/dtos/create/create-credit-card-input.dto";
import { CreateCreditCardMutationResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/create/create-credit-card-mutation-response.dto";
import { CreditCardResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/credit-card-response.dto";
import { GetCreditCardByIdInputDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/get-credit-card-by-id-input.dto";
import { ListCreditCardsInputDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/list-credit-cards-input.dto";
import { ListCreditCardsResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/get/list-credit-cards-response.dto";
import { UpdateCreditCardInputDto } from "@/modules/credit-cards/presentation/graphql/dtos/update/update-credit-card-input.dto";
import { UpdateCreditCardMutationResponseDto } from "@/modules/credit-cards/presentation/graphql/dtos/update/update-credit-card-mutation-response.dto";

@Resolver()
@RequirePageAccess(PageAccessKey.CREDIT_CARDS)
export class CreditCardsResolver {
  constructor(
    private readonly createCreditCardUseCase: CreateCreditCardUseCase,
    private readonly listCreditCardsUseCase: ListCreditCardsUseCase,
    private readonly getCreditCardByIdUseCase: GetCreditCardByIdUseCase,
    private readonly updateCreditCardUseCase: UpdateCreditCardUseCase,
  ) {}

  @Query(() => ListCreditCardsResponseDto, { name: "getMyCreditCards" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyCreditCards(
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

  @Query(() => CreditCardResponseDto, { name: "getCreditCardById" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getCreditCardById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCreditCardByIdInputDto,
  ) {
    const creditCard = await this.getCreditCardByIdUseCase.execute(
      user.idUsers,
      {
        idCreditCard: input.idCreditCard,
      },
    );

    return CreditCardResponseDto.fromView(creditCard);
  }

  @Mutation(() => CreateCreditCardMutationResponseDto, {
    name: "createCreditCard",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async createCreditCard(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateCreditCardInputDto,
  ) {
    const created = await this.createCreditCardUseCase.execute(user.idUsers, {
      name: input.name,
      creditLimit: input.creditLimit,
      dueDay: input.dueDay,
      closingDay: input.closingDay,
      status: input.status,
    });

    return buildDataResponse(
      CreditCardResponseDto.fromView(created),
      RESPONSE_MESSAGES.creditCards.created,
    );
  }

  @Mutation(() => UpdateCreditCardMutationResponseDto, {
    name: "updateCreditCard",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateCreditCard(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateCreditCardInputDto,
  ) {
    const updated = await this.updateCreditCardUseCase.execute(user.idUsers, {
      idCreditCard: input.idCreditCard,
      name: input.name,
      creditLimit: input.creditLimit,
      dueDay: input.dueDay,
      closingDay: input.closingDay,
      status: input.status,
    });

    return buildDataResponse(
      CreditCardResponseDto.fromView(updated),
      RESPONSE_MESSAGES.creditCards.updated,
    );
  }
}
