import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSubscriptionCanceledNotificationEmail } from "@/modules/mails/presentation/templates/billing/subscription-canceled-notification-email.template";
import { CANCELLATION_REASON_LABELS } from "@/modules/billing/domain/constants/cancellation-reason-labels.constant";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

const DEFAULT_COMPANY_NOTIFICATION_EMAIL = "contato.vaulto@gmail.com";
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SAO_PAULO_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const BILLING_CYCLE_LABELS: Record<SubscriptionBillingCycle, string> = {
  [SubscriptionBillingCycle.MONTHLY]: "Mensal",
  [SubscriptionBillingCycle.YEARLY]: "Anual",
};

interface SendSubscriptionCanceledNotificationEmailInput {
  userName: string;
  userEmail: string;
  reasons: CancellationReason[];
  otherReason?: string;
  billingCycle?: SubscriptionBillingCycle;
  proStartedAt?: Date;
  requestedAt: Date;
  effectiveCancellationAt: Date;
}

@Injectable()
export class SubscriptionCanceledNotificationEmailUseCase {
  private readonly logger = new Logger(
    SubscriptionCanceledNotificationEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(
    input: SendSubscriptionCanceledNotificationEmailInput,
  ): Promise<void> {
    const companyEmail =
      this.configService.get<string>("MAIL_COMPANY_NOTIFICATION_EMAIL") ||
      DEFAULT_COMPANY_NOTIFICATION_EMAIL;

    const emailTemplate = buildSubscriptionCanceledNotificationEmail({
      userName: input.userName,
      userEmail: input.userEmail,
      reasonLabels: input.reasons.map(
        (reason) => CANCELLATION_REASON_LABELS[reason],
      ),
      otherReason: input.otherReason,
      billingCycleLabel: input.billingCycle
        ? BILLING_CYCLE_LABELS[input.billingCycle]
        : "—",
      activeDurationLabel: this.buildActiveDurationLabel(
        input.proStartedAt,
        input.effectiveCancellationAt,
      ),
      requestedAtLabel: dateTimeFormatter.format(input.requestedAt),
      effectiveCancellationAtLabel: dateTimeFormatter.format(
        input.effectiveCancellationAt,
      ),
    });

    await this.mailProvider.send({
      to: { email: companyEmail, name: "Vaulto" },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Notificação de cancelamento enviada para ${companyEmail} (usuário: ${input.userEmail})`,
    );
  }

  private buildActiveDurationLabel(
    proStartedAt: Date | undefined,
    effectiveCancellationAt: Date,
  ): string {
    if (!proStartedAt) {
      return "—";
    }

    const days = Math.max(
      0,
      Math.round(
        (effectiveCancellationAt.getTime() - proStartedAt.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    );

    return days === 1 ? "1 dia" : `${days} dias`;
  }
}
