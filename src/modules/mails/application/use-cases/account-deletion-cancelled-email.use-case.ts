import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildAccountDeletionCancelledEmail } from "@/modules/mails/presentation/templates/account-lifecycle/account-deletion-cancelled-email.template";

interface SendAccountDeletionCancelledEmailInput {
  to: string;
  name: string;
}

@Injectable()
export class AccountDeletionCancelledEmailUseCase {
  private readonly logger = new Logger(
    AccountDeletionCancelledEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendAccountDeletionCancelledEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildAccountDeletionCancelledEmail({
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
      `Email de cancelamento de exclusão enviado para ${input.to}`,
    );
  }
}
