import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildUserWelcomeEmail } from "@/modules/mails/presentation/templates/welcome/user-welcome-email.template";

interface SendUserWelcomeEmailInput {
  to: string;
  name: string;
}

@Injectable()
export class UserWelcomeEmailUseCase {
  private readonly logger = new Logger(UserWelcomeEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendUserWelcomeEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildUserWelcomeEmail({
      name: input.name,
      email: input.to,
      appUrl,
    });

    await this.mailProvider.send({
      to: {
        email: input.to,
        name: input.name,
      },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      replyTo: this.buildReplyTo(),
    });

    this.logger.log(`Email de boas-vindas enviado para ${input.to}`);
  }

  private buildReplyTo() {
    const replyToEmail = this.configService.get<string>("MAIL_REPLY_TO_EMAIL");

    if (!replyToEmail) {
      return undefined;
    }

    return {
      email: replyToEmail,
      name:
        this.configService.get<string>("MAIL_REPLY_TO_NAME") ||
        this.configService.get<string>("MAIL_FROM_NAME") ||
        "Vaulto",
    };
  }
}
