import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildAccountDeactivationConfirmationEmail } from "@/modules/mails/presentation/templates/account-lifecycle/account-deactivation-confirmation-email.template";

interface SendAccountDeactivationConfirmationEmailInput {
  to: string;
  name: string;
}

@Injectable()
export class AccountDeactivationConfirmationEmailUseCase {
  private readonly logger = new Logger(
    AccountDeactivationConfirmationEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(
    input: SendAccountDeactivationConfirmationEmailInput,
  ): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildAccountDeactivationConfirmationEmail({
      appUrl,
      name: input.name,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Email de confirmação de inativação enviado para ${input.to}`,
    );
  }
}
