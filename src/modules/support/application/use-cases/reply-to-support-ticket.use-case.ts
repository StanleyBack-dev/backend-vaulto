import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { SupportTicketReplyEmailUseCase } from "@/modules/mails/application/use-cases/support-ticket-reply-email.use-case";
import type { ReplyToSupportTicketCommand } from "@/modules/support/application/dto/reply-to-support-ticket.command";
import type { SupportTicketAdminView } from "@/modules/support/application/dto/support-ticket-admin-view.type";
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type SupportMessageRepositoryPort,
} from "@/modules/support/application/ports/support-message-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class ReplyToSupportTicketUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly supportMessageRepository: SupportMessageRepositoryPort,
    private readonly supportTicketReplyEmailUseCase: SupportTicketReplyEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    command: ReplyToSupportTicketCommand,
  ): Promise<SupportTicketAdminView> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_SUPPORT_TICKETS,
    );

    if (!command.reply.trim()) {
      throw AppException.from(APP_ERRORS.support.replyRequired, undefined);
    }

    const ticket = await this.supportMessageRepository.findTicketById(
      command.idSupportMessage,
    );

    if (!ticket) {
      throw AppException.from(APP_ERRORS.support.ticketNotFound, undefined);
    }

    const reply = command.reply.trim();

    const updated = await this.supportMessageRepository.reply({
      idSupportMessage: command.idSupportMessage,
      adminReply: reply,
      repliedAt: new Date(),
      repliedByAdminId: idUsers,
    });

    const user = await this.userRepository.findOne({
      where: { idUsers: ticket.idUsers },
    });

    if (user) {
      await this.supportTicketReplyEmailUseCase.send({
        to: user.email,
        name: user.name,
        protocolNumber: ticket.protocolNumber,
        category: ticket.category,
        originalMessage: ticket.message,
        reply,
      });
    }

    return {
      ...updated,
      userName: user?.name ?? "—",
      userEmail: user?.email ?? "—",
    };
  }
}
