import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { FinalizeSupportTicketUseCase } from "@/modules/support/application/use-cases/finalize-support-ticket.use-case";
import { GetSupportTicketUseCase } from "@/modules/support/application/use-cases/get-support-ticket.use-case";
import { ListSupportTicketsUseCase } from "@/modules/support/application/use-cases/list-support-tickets.use-case";
import { ReplyToSupportTicketUseCase } from "@/modules/support/application/use-cases/reply-to-support-ticket.use-case";
import { ListSupportTicketsInputDto } from "@/modules/support/presentation/graphql/dtos/list-support-tickets-input.dto";
import { ReplyToSupportTicketInputDto } from "@/modules/support/presentation/graphql/dtos/reply-to-support-ticket-input.dto";
import { SupportTicketResponseDto } from "@/modules/support/presentation/graphql/dtos/support-ticket-response.dto";
import { SupportTicketsResponseDto } from "@/modules/support/presentation/graphql/dtos/support-tickets-response.dto";

@Resolver()
@RequirePageAccess(PageAccessKey.ADMIN)
export class SupportAdminResolver {
  constructor(
    private readonly listSupportTicketsUseCase: ListSupportTicketsUseCase,
    private readonly getSupportTicketUseCase: GetSupportTicketUseCase,
    private readonly replyToSupportTicketUseCase: ReplyToSupportTicketUseCase,
    private readonly finalizeSupportTicketUseCase: FinalizeSupportTicketUseCase,
  ) {}

  @Query(() => SupportTicketsResponseDto, { name: "listSupportTickets" })
  @RequirePermissions(AuthPermission.READ_SUPPORT_TICKETS)
  async listSupportTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListSupportTicketsInputDto,
  ) {
    const result = await this.listSupportTicketsUseCase.execute(user.idUsers, {
      page: input?.page,
      limit: input?.limit,
      status: input?.status,
      category: input?.category,
    });

    return SupportTicketsResponseDto.fromResult(result);
  }

  @Query(() => SupportTicketResponseDto, { name: "getSupportTicket" })
  @RequirePermissions(AuthPermission.READ_SUPPORT_TICKETS)
  async getSupportTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idSupportMessage") idSupportMessage: string,
  ) {
    const ticket = await this.getSupportTicketUseCase.execute(
      user.idUsers,
      idSupportMessage,
    );

    return SupportTicketResponseDto.fromView(ticket);
  }

  @Mutation(() => SupportTicketResponseDto, { name: "replyToSupportTicket" })
  @RequirePermissions(AuthPermission.MANAGE_SUPPORT_TICKETS)
  async replyToSupportTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ReplyToSupportTicketInputDto,
  ) {
    const ticket = await this.replyToSupportTicketUseCase.execute(
      user.idUsers,
      {
        idSupportMessage: input.idSupportMessage,
        reply: input.reply,
      },
    );

    return SupportTicketResponseDto.fromView(ticket);
  }

  @Mutation(() => SupportTicketResponseDto, { name: "finalizeSupportTicket" })
  @RequirePermissions(AuthPermission.MANAGE_SUPPORT_TICKETS)
  async finalizeSupportTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idSupportMessage") idSupportMessage: string,
  ) {
    const ticket = await this.finalizeSupportTicketUseCase.execute(
      user.idUsers,
      idSupportMessage,
    );

    return SupportTicketResponseDto.fromView(ticket);
  }
}
