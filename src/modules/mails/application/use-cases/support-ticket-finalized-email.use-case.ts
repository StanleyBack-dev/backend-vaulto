import { Inject, Injectable, Logger } from "@nestjs/common";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSupportTicketFinalizedEmail } from "@/modules/mails/presentation/templates/support/support-ticket-finalized-email.template";
import { SUPPORT_CATEGORY_LABELS } from "@/modules/support/domain/constants/support-category-labels.constant";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

interface SendSupportTicketFinalizedEmailInput {
  to: string;
  name: string;
  protocolNumber: number;
  category: SupportCategory;
  adminReply?: string;
}

@Injectable()
export class SupportTicketFinalizedEmailUseCase {
  private readonly logger = new Logger(SupportTicketFinalizedEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
  ) {}

  async send(input: SendSupportTicketFinalizedEmailInput): Promise<void> {
    const protocolLabel = `#${String(input.protocolNumber).padStart(6, "0")}`;

    const emailTemplate = buildSupportTicketFinalizedEmail({
      name: input.name,
      protocolLabel,
      categoryLabel: SUPPORT_CATEGORY_LABELS[input.category],
      adminReply: input.adminReply,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Finalização do chamado ${protocolLabel} notificada para ${input.to}`,
    );
  }
}
