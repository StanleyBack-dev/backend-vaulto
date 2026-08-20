import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildReferralInviteEmail } from "@/modules/mails/presentation/templates/referrals/referral-invite-email.template";

interface SendReferralInviteEmailInput {
  to: string;
  referrerName: string;
  referralCode: string;
}

@Injectable()
export class ReferralInviteEmailUseCase {
  private readonly logger = new Logger(ReferralInviteEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendReferralInviteEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildReferralInviteEmail({
      appUrl,
      referrerName: input.referrerName,
      referralCode: input.referralCode,
    });

    await this.mailProvider.send({
      to: { email: input.to },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(`Email de convite de indicação enviado para ${input.to}`);
  }
}
