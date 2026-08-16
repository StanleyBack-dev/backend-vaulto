import { Inject, Injectable, Logger } from "@nestjs/common";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSupportMessageConfirmationEmail } from "@/modules/mails/presentation/templates/support/support-message-confirmation-email.template";
import { SUPPORT_CATEGORY_LABELS } from "@/modules/support/domain/constants/support-category-labels.constant";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

interface SendSupportMessageConfirmationEmailInput {
  to: string;
  name: string;
  category: SupportCategory;
  message: string;
}

@Injectable()
export class SupportMessageConfirmationEmailUseCase {
  private readonly logger = new Logger(
    SupportMessageConfirmationEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
  ) {}

  async send(input: SendSupportMessageConfirmationEmailInput): Promise<void> {
    const emailTemplate = buildSupportMessageConfirmationEmail({
      name: input.name,
      categoryLabel: SUPPORT_CATEGORY_LABELS[input.category],
      message: input.message,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Confirmação de mensagem de suporte enviada para ${input.to}`,
    );
  }
}
