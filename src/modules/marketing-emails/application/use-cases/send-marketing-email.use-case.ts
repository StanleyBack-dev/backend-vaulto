import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import type { SendMarketingEmailCommand } from "@/modules/marketing-emails/application/dto/send-marketing-email.command";
import type { MarketingEmailSendAdminView } from "@/modules/marketing-emails/application/dto/marketing-email-send-admin-view.type";
import {
  MARKETING_EMAIL_REPOSITORY,
  type MarketingEmailRepositoryPort,
} from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";
import { buildPartnerOutreachEmail } from "@/modules/marketing-emails/presentation/templates/partner-outreach-email.template";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

@Injectable()
export class SendMarketingEmailUseCase {
  private readonly logger = new Logger(SendMarketingEmailUseCase.name);

  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(MARKETING_EMAIL_REPOSITORY)
    private readonly marketingEmailRepository: MarketingEmailRepositoryPort,
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    adminId: string,
    command: SendMarketingEmailCommand,
  ): Promise<MarketingEmailSendAdminView> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.MANAGE_MARKETING_EMAILS,
    );

    const subject = command.subject.trim();
    if (!subject) {
      throw AppException.from(APP_ERRORS.marketingEmails.subjectRequired, undefined);
    }

    const bodyMarkdown = command.bodyMarkdown.trim();
    if (!bodyMarkdown) {
      throw AppException.from(APP_ERRORS.marketingEmails.bodyRequired, undefined);
    }

    const recipientEmail = command.recipientEmail.trim().toLowerCase();
    const nextAllowedAt = await this.resolveNextAllowedAt(recipientEmail);
    if (nextAllowedAt) {
      throw AppException.from(
        APP_ERRORS.marketingEmails.recipientCooldownActive,
        { nextAllowedAt },
      );
    }

    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";
    const emailTemplate = buildPartnerOutreachEmail({
      appUrl,
      subject,
      bodyMarkdown,
      recipientName: command.recipientName,
      partnershipPercentage: command.partnershipPercentage,
    });

    try {
      await this.mailProvider.send({
        to: { email: recipientEmail, name: command.recipientName.trim() },
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      throw AppException.from(APP_ERRORS.marketingEmails.sendFailed, undefined);
    }

    const created = await this.marketingEmailRepository.create({
      category: command.category,
      recipientEmail,
      recipientName: command.recipientName.trim(),
      recipientPhone: command.recipientPhone?.trim() || undefined,
      subject,
      bodyMarkdown,
      partnershipPercentage: command.partnershipPercentage,
      sentByAdminId: adminId,
      createdAt: new Date(),
    });

    this.logger.log(`E-mail de parceria enviado para ${recipientEmail}`);

    const admin = await this.userRepository.findOne({
      where: { idUsers: adminId },
    });

    return { ...created, sentByAdminName: admin?.name ?? "—" };
  }

  private async resolveNextAllowedAt(
    recipientEmail: string,
  ): Promise<Date | null> {
    const mostRecentSend =
      await this.marketingEmailRepository.findMostRecentSendForEmail(
        recipientEmail,
      );

    if (!mostRecentSend) {
      return null;
    }

    const nextAllowedAt = new Date(
      mostRecentSend.createdAt.getTime() + COOLDOWN_MS,
    );

    return nextAllowedAt > new Date() ? nextAllowedAt : null;
  }
}
