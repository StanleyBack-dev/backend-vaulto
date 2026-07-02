import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateAccountUseCase } from "@/modules/accounts/application/use-cases/create/create-account.use-case";
import { ListAccountsUseCase } from "@/modules/accounts/application/use-cases/get/list-accounts.use-case";
import { TransferBetweenAccountsUseCase } from "@/modules/accounts/application/use-cases/transfer/transfer-between-accounts.use-case";
import { CreateAccountInputDto } from "@/modules/accounts/presentation/graphql/dtos/create/create-account-input.dto";
import { CreateAccountMutationResponseDto } from "@/modules/accounts/presentation/graphql/dtos/create/create-account-mutation-response.dto";
import { AccountResponseDto } from "@/modules/accounts/presentation/graphql/dtos/get/account-response.dto";
import { ListAccountsResponseDto } from "@/modules/accounts/presentation/graphql/dtos/get/list-accounts-response.dto";
import { TransferBetweenAccountsInputDto } from "@/modules/accounts/presentation/graphql/dtos/transfer/transfer-between-accounts-input.dto";
import { TransferBetweenAccountsMutationResponseDto } from "@/modules/accounts/presentation/graphql/dtos/transfer/transfer-between-accounts-mutation-response.dto";
import { TransferBetweenAccountsResponseDto } from "@/modules/accounts/presentation/graphql/dtos/transfer/transfer-between-accounts-response.dto";

@Resolver()
export class AccountsResolver {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly transferBetweenAccountsUseCase: TransferBetweenAccountsUseCase,
  ) {}

  @Mutation(() => CreateAccountMutationResponseDto, { name: "createAccount" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_ACCOUNTS)
  async createAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateAccountInputDto,
  ) {
    const created = await this.createAccountUseCase.execute(user.idUsers, {
      name: input.name,
      accountType: input.accountType,
      initialBalance: input.initialBalance,
    });

    return buildDataResponse(
      AccountResponseDto.fromView(created),
      RESPONSE_MESSAGES.accounts.created,
    );
  }

  @Query(() => ListAccountsResponseDto, { name: "getMyAccounts" })
  @RequirePermissions(AuthPermission.READ_OWN_ACCOUNTS)
  async getMyAccounts(@CurrentUser() user: AuthenticatedUser) {
    const accounts = await this.listAccountsUseCase.execute(user.idUsers);

    return buildPaginatedListResponse(
      {
        items: accounts.map((account) => AccountResponseDto.fromView(account)),
        total: accounts.length,
        currentPage: 1,
        limit: accounts.length || 1,
        totalPages: accounts.length ? 1 : 0,
        hasNextPage: false,
      },
      RESPONSE_MESSAGES.accounts.listed,
    );
  }

  @Mutation(() => TransferBetweenAccountsMutationResponseDto, {
    name: "transferBetweenAccounts",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_ACCOUNTS)
  async transferBetweenAccounts(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: TransferBetweenAccountsInputDto,
  ) {
    const result = await this.transferBetweenAccountsUseCase.execute(user.idUsers, {
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      amount: input.amount,
      description: input.description,
      transferredAt: input.transferredAt,
    });

    return buildDataResponse(
      TransferBetweenAccountsResponseDto.fromView(result),
      RESPONSE_MESSAGES.accounts.transferred,
    );
  }
}


