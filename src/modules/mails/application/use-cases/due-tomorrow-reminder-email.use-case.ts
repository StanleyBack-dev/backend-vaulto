import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MailProviderPort } from "@/modules/mails/application/ports/mail-provider.port";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import {
  buildDueTomorrowReminderEmail,
  type DueTomorrowReminderItem,
} from "@/modules/mails/presentation/templates/reminders/due-tomorrow-reminder-email.template";

interface SendDueTomorrowReminderEmailInput {
  to: string;
  name: string;
  debts: DueTomorrowReminderItem[];
  incomes: DueTomorrowReminderItem[];
}

@Injectable()
export class DueTomorrowReminderEmailUseCase {
  private readonly logger = new Logger(DueTomorrowReminderEmailUseCase.name);

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly mailProvider: MailProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async send(input: SendDueTomorrowReminderEmailInput): Promise<void> {
    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildDueTomorrowReminderEmail({
      appUrl,
      name: input.name,
      debts: input.debts,
      incomes: input.incomes,
    });

    await this.mailProvider.send({
      to: { email: input.to, name: input.name },
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    this.logger.log(
      `Email de lembrete de vencimentos enviado para ${input.to}`,
    );
  }
}
