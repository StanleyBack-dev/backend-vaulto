import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildAccountReactivationWelcomeBackEmail } from "@/modules/mails/presentation/templates/account-lifecycle/account-reactivation-welcome-back-email.template";

interface SendAccountReactivationWelcomeBackEmailInput {
  to: string;
  name: string;
}

@Injectable()
export class AccountReactivationWelcomeBackEmailUseCase {
  private readonly logger = new Logger(
    AccountReactivationWelcomeBackEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(
    input: SendAccountReactivationWelcomeBackEmailInput,
  ): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildAccountReactivationWelcomeBackEmail({
      appUrl,
      name: input.name,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(`Email de boas-vindas de volta enviado para ${input.to}`);
  }
}
