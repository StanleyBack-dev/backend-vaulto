import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { MailModule } from "@/modules/mails/mail.module";
import { REMINDERS_REPOSITORY } from "@/modules/reminders/application/ports/reminders-repository.port";
import { SendDueTomorrowRemindersUseCase } from "@/modules/reminders/application/use-cases/send-due-tomorrow-reminders.use-case";
import { RemindersTypeormRepository } from "@/modules/reminders/infrastructure/persistence/typeorm/repositories/reminders-typeorm.repository";
import { RemindersController } from "@/modules/reminders/presentation/rest/controllers/reminders.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([DebtInstallmentEntity, IncomeInstallmentEntity]),
    MailModule,
  ],
  controllers: [RemindersController],
  providers: [
    SendDueTomorrowRemindersUseCase,
    RemindersTypeormRepository,
    {
      provide: REMINDERS_REPOSITORY,
      useExisting: RemindersTypeormRepository,
    },
  ],
})
export class RemindersModule {}
