import { Inject, Injectable, Logger } from "@nestjs/common";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSupportTicketReplyEmail } from "@/modules/mails/presentation/templates/support/support-ticket-reply-email.template";
import { SUPPORT_CATEGORY_LABELS } from "@/modules/support/domain/constants/support-category-labels.constant";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

interface SendSupportTicketReplyEmailInput {
  to: string;
  name: string;
  protocolNumber: number;
  category: SupportCategory;
  originalMessage: string;
  reply: string;
}

@Injectable()
export class SupportTicketReplyEmailUseCase {
  private readonly logger = new Logger(SupportTicketReplyEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
  ) {}

  async send(input: SendSupportTicketReplyEmailInput): Promise<void> {
    const protocolLabel = `#${String(input.protocolNumber).padStart(6, "0")}`;

    const emailTemplate = buildSupportTicketReplyEmail({
      name: input.name,
      protocolLabel,
      categoryLabel: SUPPORT_CATEGORY_LABELS[input.category],
      originalMessage: input.originalMessage,
      reply: input.reply,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Resposta do chamado ${protocolLabel} enviada para ${input.to}`,
    );
  }
}
