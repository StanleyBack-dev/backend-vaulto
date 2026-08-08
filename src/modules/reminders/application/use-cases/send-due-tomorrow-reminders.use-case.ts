import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  REMINDERS_REPOSITORY,
  type RemindersRepositoryPort,
} from "@/modules/reminders/application/ports/reminders-repository.port";
import { DueTomorrowReminderEmailUseCase } from "@/modules/mails/application/use-cases/due-tomorrow-reminder-email.use-case";

export interface SendDueTomorrowRemindersResult {
  remindersSent: number;
}

@Injectable()
export class SendDueTomorrowRemindersUseCase {
  private readonly logger = new Logger(SendDueTomorrowRemindersUseCase.name);

  constructor(
    @Inject(REMINDERS_REPOSITORY)
    private readonly remindersRepository: RemindersRepositoryPort,
    private readonly dueTomorrowReminderEmailUseCase: DueTomorrowReminderEmailUseCase,
  ) {}

  async execute(): Promise<SendDueTomorrowRemindersResult> {
    const tomorrow = this.addDays(new Date(), 1);
    const reminders =
      await this.remindersRepository.findProUsersWithDueTomorrow(tomorrow);

    for (const reminder of reminders) {
      await this.dueTomorrowReminderEmailUseCase.send({
        to: reminder.email,
        name: reminder.name,
        debts: reminder.debts,
        incomes: reminder.incomes,
      });
    }

    this.logger.log(
      `Reminders job: ${reminders.length} lembrete(s) de vencimento enviado(s).`,
    );

    return { remindersSent: reminders.length };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
