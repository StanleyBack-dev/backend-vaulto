import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildAccountDeletionRequestedEmail } from "@/modules/mails/presentation/templates/account-lifecycle/account-deletion-requested-email.template";

interface SendAccountDeletionRequestedEmailInput {
  to: string;
  name: string;
  scheduledFor: Date;
}

@Injectable()
export class AccountDeletionRequestedEmailUseCase {
  private readonly logger = new Logger(
    AccountDeletionRequestedEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendAccountDeletionRequestedEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildAccountDeletionRequestedEmail({
      appUrl,
      name: input.name,
      scheduledFor: input.scheduledFor,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Email de solicitação de exclusão enviado para ${input.to}`,
    );
  }
}
