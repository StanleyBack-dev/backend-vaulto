import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import type { UpdateMarketingEmailSendContactCommand } from "@/modules/marketing-emails/application/dto/update-marketing-email-send-contact.command";
import type { MarketingEmailSendAdminView } from "@/modules/marketing-emails/application/dto/marketing-email-send-admin-view.type";
import {
  MARKETING_EMAIL_REPOSITORY,
  type MarketingEmailRepositoryPort,
} from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

// Only touches metadata about the recipient (name, category, phone, social
// link) gathered/corrected after the fact — never re-sends the e-mail,
// re-checks the 7-day cooldown, or changes the subject/body that was
// actually delivered.
@Injectable()
export class UpdateMarketingEmailSendContactUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(MARKETING_EMAIL_REPOSITORY)
    private readonly marketingEmailRepository: MarketingEmailRepositoryPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    adminId: string,
    command: UpdateMarketingEmailSendContactCommand,
  ): Promise<MarketingEmailSendAdminView> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.MANAGE_MARKETING_EMAILS,
    );

    const trimmedName = command.recipientName?.trim();

    const updated = await this.marketingEmailRepository.updateContactInfo(
      command.idMarketingEmailSend,
      {
        recipientName: trimmedName || undefined,
        category: command.category,
        recipientPhone: command.recipientPhone?.trim() || null,
        socialMediaLink: command.socialMediaLink?.trim() || null,
      },
    );

    if (!updated) {
      throw AppException.from(
        APP_ERRORS.marketingEmails.sendNotFound,
        undefined,
      );
    }

    const admin = await this.userRepository.findOne({
      where: { idUsers: updated.sentByAdminId },
    });

    return { ...updated, sentByAdminName: admin?.name ?? "—" };
  }
}
