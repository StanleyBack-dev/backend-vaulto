import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildSuccessResponse } from "@/common/responses/helpers/response.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CancelAccountDeletionUseCase } from "@/modules/account-lifecycle/application/use-cases/cancel-account-deletion.use-case";
import { DeactivateAccountUseCase } from "@/modules/account-lifecycle/application/use-cases/deactivate-account.use-case";
import { RequestAccountDeletionUseCase } from "@/modules/account-lifecycle/application/use-cases/request-account-deletion.use-case";
import { CancelAccountDeletionResponseDto } from "@/modules/account-lifecycle/presentation/graphql/dtos/cancel-account-deletion-response.dto";
import { DeactivateAccountInputDto } from "@/modules/account-lifecycle/presentation/graphql/dtos/deactivate-account-input.dto";
import { DeactivateAccountResponseDto } from "@/modules/account-lifecycle/presentation/graphql/dtos/deactivate-account-response.dto";
import { RequestAccountDeletionInputDto } from "@/modules/account-lifecycle/presentation/graphql/dtos/request-account-deletion-input.dto";
import { RequestAccountDeletionResponseDto } from "@/modules/account-lifecycle/presentation/graphql/dtos/request-account-deletion-response.dto";
import "@/modules/account-lifecycle/presentation/graphql/enums/account-lifecycle-graphql.enums";

@Resolver()
export class AccountLifecycleResolver {
  constructor(
    private readonly deactivateAccountUseCase: DeactivateAccountUseCase,
    private readonly requestAccountDeletionUseCase: RequestAccountDeletionUseCase,
    private readonly cancelAccountDeletionUseCase: CancelAccountDeletionUseCase,
  ) {}

  @Mutation(() => DeactivateAccountResponseDto, { name: "deactivateAccount" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async deactivateAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: DeactivateAccountInputDto,
  ) {
    await this.deactivateAccountUseCase.execute(user.idUsers, {
      reasons: input.reasons,
      otherReason: input.otherReason,
    });

    return buildSuccessResponse(RESPONSE_MESSAGES.accountLifecycle.deactivated);
  }

  @Mutation(() => RequestAccountDeletionResponseDto, {
    name: "requestAccountDeletion",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async requestAccountDeletion(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RequestAccountDeletionInputDto,
  ) {
    await this.requestAccountDeletionUseCase.execute(user.idUsers, {
      reasons: input.reasons,
      otherReason: input.otherReason,
    });

    return buildSuccessResponse(
      RESPONSE_MESSAGES.accountLifecycle.deletionRequested,
    );
  }

  @Mutation(() => CancelAccountDeletionResponseDto, {
    name: "cancelAccountDeletion",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async cancelAccountDeletion(@CurrentUser() user: AuthenticatedUser) {
    await this.cancelAccountDeletionUseCase.execute(user.idUsers);

    return buildSuccessResponse(
      RESPONSE_MESSAGES.accountLifecycle.deletionCancelled,
    );
  }
}
