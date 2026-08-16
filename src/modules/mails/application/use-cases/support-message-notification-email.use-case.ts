import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSupportMessageNotificationEmail } from "@/modules/mails/presentation/templates/support/support-message-notification-email.template";
import { SUPPORT_CATEGORY_LABELS } from "@/modules/support/domain/constants/support-category-labels.constant";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

const DEFAULT_COMPANY_NOTIFICATION_EMAIL = "contato.vaulto@gmail.com";
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SAO_PAULO_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

interface SendSupportMessageNotificationEmailInput {
  userName: string;
  userEmail: string;
  category: SupportCategory;
  message: string;
  sentAt: Date;
}

@Injectable()
export class SupportMessageNotificationEmailUseCase {
  private readonly logger = new Logger(
    SupportMessageNotificationEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendSupportMessageNotificationEmailInput): Promise<void> {
    const companyEmail =
      this.configService.get<string>("MAIL_COMPANY_NOTIFICATION_EMAIL") ||
      DEFAULT_COMPANY_NOTIFICATION_EMAIL;

    const emailTemplate = buildSupportMessageNotificationEmail({
      userName: input.userName,
      userEmail: input.userEmail,
      categoryLabel: SUPPORT_CATEGORY_LABELS[input.category],
      message: input.message,
      sentAtLabel: dateTimeFormatter.format(input.sentAt),
    });

    await this.mailProvider.send({
      to: { email: companyEmail, name: "Vaulto" },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Notificação de mensagem de suporte enviada para ${companyEmail} (usuário: ${input.userEmail})`,
    );
  }
}
