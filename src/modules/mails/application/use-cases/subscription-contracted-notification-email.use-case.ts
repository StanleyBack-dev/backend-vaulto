import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { buildSubscriptionContractedNotificationEmail } from "@/modules/mails/presentation/templates/billing/subscription-contracted-notification-email.template";
import { PRO_PLAN_PRICES } from "@/modules/billing/domain/constants/pro-plan.constant";
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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BILLING_CYCLE_LABELS: Record<SubscriptionBillingCycle, string> = {
  [SubscriptionBillingCycle.MONTHLY]: "Mensal",
  [SubscriptionBillingCycle.YEARLY]: "Anual",
};

interface SendSubscriptionContractedNotificationEmailInput {
  userName: string;
  userEmail: string;
  billingCycle?: SubscriptionBillingCycle;
  confirmedAt: Date;
}

@Injectable()
export class SubscriptionContractedNotificationEmailUseCase {
  private readonly logger = new Logger(
    SubscriptionContractedNotificationEmailUseCase.name,
  );

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(
    input: SendSubscriptionContractedNotificationEmailInput,
  ): Promise<void> {
    const companyEmail =
      this.configService.get<string>("MAIL_COMPANY_NOTIFICATION_EMAIL") ||
      DEFAULT_COMPANY_NOTIFICATION_EMAIL;

    const emailTemplate = buildSubscriptionContractedNotificationEmail({
      userName: input.userName,
      userEmail: input.userEmail,
      billingCycleLabel: input.billingCycle
        ? BILLING_CYCLE_LABELS[input.billingCycle]
        : "—",
      priceLabel: input.billingCycle
        ? currencyFormatter.format(PRO_PLAN_PRICES[input.billingCycle])
        : "—",
      confirmedAtLabel: dateTimeFormatter.format(input.confirmedAt),
    });

    await this.mailProvider.send({
      to: { email: companyEmail, name: "Vaulto" },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Notificação de nova assinatura enviada para ${companyEmail} (usuário: ${input.userEmail})`,
    );
  }
}
