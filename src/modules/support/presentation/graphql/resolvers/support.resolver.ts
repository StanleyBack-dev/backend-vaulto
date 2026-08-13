import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetSupportMessageStatusUseCase } from "@/modules/support/application/use-cases/get-support-message-status.use-case";
import { SendSupportMessageUseCase } from "@/modules/support/application/use-cases/send-support-message.use-case";
import { SendSupportMessageInputDto } from "@/modules/support/presentation/graphql/dtos/send-support-message-input.dto";
import { SupportMessageResponseDto } from "@/modules/support/presentation/graphql/dtos/support-message-response.dto";
import { SupportMessageStatusResponseDto } from "@/modules/support/presentation/graphql/dtos/support-message-status-response.dto";

@Resolver()
export class SupportResolver {
  constructor(
    private readonly sendSupportMessageUseCase: SendSupportMessageUseCase,
    private readonly getSupportMessageStatusUseCase: GetSupportMessageStatusUseCase,
  ) {}

  @Query(() => SupportMessageStatusResponseDto, {
    name: "mySupportMessageStatus",
  })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async mySupportMessageStatus(@CurrentUser() user: AuthenticatedUser) {
    const status = await this.getSupportMessageStatusUseCase.execute(
      user.idUsers,
    );

    return SupportMessageStatusResponseDto.fromView(status);
  }

  @Mutation(() => SupportMessageResponseDto, { name: "sendSupportMessage" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async sendSupportMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SendSupportMessageInputDto,
  ) {
    const supportMessage = await this.sendSupportMessageUseCase.execute(
      user.idUsers,
      {
        category: input.category,
        message: input.message,
      },
    );

    return SupportMessageResponseDto.fromView(supportMessage);
  }
}
