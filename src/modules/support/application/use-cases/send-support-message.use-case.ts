import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { SupportMessageConfirmationEmailUseCase } from "@/modules/mails/application/use-cases/support-message-confirmation-email.use-case";
import { SupportMessageNotificationEmailUseCase } from "@/modules/mails/application/use-cases/support-message-notification-email.use-case";
import type { SendSupportMessageCommand } from "@/modules/support/application/dto/send-support-message.command";
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type SupportMessageRepositoryPort,
  type SupportMessageView,
} from "@/modules/support/application/ports/support-message-repository.port";
import { SupportDayBoundaryService } from "@/modules/support/domain/services/support-day-boundary.service";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class SendSupportMessageUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly supportMessageRepository: SupportMessageRepositoryPort,
    private readonly supportMessageNotificationEmailUseCase: SupportMessageNotificationEmailUseCase,
    private readonly supportMessageConfirmationEmailUseCase: SupportMessageConfirmationEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    command: SendSupportMessageCommand,
  ): Promise<SupportMessageView> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    if (!command.message.trim()) {
      throw AppException.from(APP_ERRORS.support.messageRequired, undefined);
    }

    const now = new Date();
    const alreadySentToday =
      await this.supportMessageRepository.hasMessageSince(
        idUsers,
        SupportDayBoundaryService.startOfTodayInSaoPaulo(now),
      );

    if (alreadySentToday) {
      throw AppException.from(APP_ERRORS.support.dailyLimitReached, undefined);
    }

    const created = await this.supportMessageRepository.create({
      idUsers,
      category: command.category,
      message: command.message.trim(),
      createdAt: now,
    });

    await this.notifyOfSupportMessage(idUsers, created);

    return created;
  }

  private async notifyOfSupportMessage(
    idUsers: string,
    supportMessage: SupportMessageView,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      return;
    }

    await this.supportMessageNotificationEmailUseCase.send({
      userName: user.name,
      userEmail: user.email,
      category: supportMessage.category,
      message: supportMessage.message,
      sentAt: supportMessage.createdAt,
    });

    await this.supportMessageConfirmationEmailUseCase.send({
      to: user.email,
      name: user.name,
      category: supportMessage.category,
      message: supportMessage.message,
    });
  }
}
