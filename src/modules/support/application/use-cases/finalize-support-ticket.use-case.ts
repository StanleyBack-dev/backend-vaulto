import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { SupportTicketFinalizedEmailUseCase } from "@/modules/mails/application/use-cases/support-ticket-finalized-email.use-case";
import type { SupportTicketAdminView } from "@/modules/support/application/dto/support-ticket-admin-view.type";
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type SupportMessageRepositoryPort,
} from "@/modules/support/application/ports/support-message-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class FinalizeSupportTicketUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly supportMessageRepository: SupportMessageRepositoryPort,
    private readonly supportTicketFinalizedEmailUseCase: SupportTicketFinalizedEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    idSupportMessage: string,
  ): Promise<SupportTicketAdminView> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_SUPPORT_TICKETS,
    );

    const ticket =
      await this.supportMessageRepository.findTicketById(idSupportMessage);

    if (!ticket) {
      throw AppException.from(APP_ERRORS.support.ticketNotFound, undefined);
    }

    const updated = await this.supportMessageRepository.finalize(
      idSupportMessage,
      idUsers,
    );

    const [requester, admin] = await Promise.all([
      this.userRepository.findOne({ where: { idUsers: ticket.idUsers } }),
      this.userRepository.findOne({ where: { idUsers } }),
    ]);

    if (requester) {
      await this.supportTicketFinalizedEmailUseCase.send({
        to: requester.email,
        name: requester.name,
        protocolNumber: ticket.protocolNumber,
        category: ticket.category,
        adminReply: ticket.adminReply,
      });
    }

    return {
      ...updated,
      userName: requester?.name ?? "—",
      userEmail: requester?.email ?? "—",
      finalizedByName: admin?.name,
    };
  }
}
