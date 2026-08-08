import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildPaymentOverdueEmail } from "@/modules/mails/presentation/templates/billing/payment-overdue-email.template";

interface SendPaymentOverdueEmailInput {
  to: string;
  name: string;
  graceDays: number;
}

@Injectable()
export class PaymentOverdueEmailUseCase {
  private readonly logger = new Logger(PaymentOverdueEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendPaymentOverdueEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildPaymentOverdueEmail({
      appUrl,
      name: input.name,
      graceDays: input.graceDays,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Email de pagamento nao identificado enviado para ${input.to}`,
    );
  }
}
