import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSubscriptionActivatedEmail } from "@/modules/mails/presentation/templates/billing/subscription-activated-email.template";

interface SendSubscriptionActivatedEmailInput {
  to: string;
  name: string;
}

@Injectable()
export class SubscriptionActivatedEmailUseCase {
  private readonly logger = new Logger(SubscriptionActivatedEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendSubscriptionActivatedEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildSubscriptionActivatedEmail({
      appUrl,
      name: input.name,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(`Email de Pro ativado enviado para ${input.to}`);
  }
}
