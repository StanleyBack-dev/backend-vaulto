import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildReferralCreditGrantedEmail } from "@/modules/mails/presentation/templates/referrals/referral-credit-granted-email.template";

interface SendReferralCreditGrantedEmailInput {
  to: string;
  name: string;
  amountCents: number;
  holdDays: number;
}

@Injectable()
export class ReferralCreditGrantedEmailUseCase {
  private readonly logger = new Logger(ReferralCreditGrantedEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendReferralCreditGrantedEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildReferralCreditGrantedEmail({
      appUrl,
      name: input.name,
      amountCents: input.amountCents,
      holdDays: input.holdDays,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(`Email de crédito de indicação enviado para ${input.to}`);
  }
}
