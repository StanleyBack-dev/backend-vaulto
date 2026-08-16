import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { CronAuthGuard } from "@/common/guards/cron-auth.guard";
import { SendDueTomorrowRemindersUseCase } from "@/modules/reminders/application/use-cases/send-due-tomorrow-reminders.use-case";

// Triggered daily by a Vercel Cron Job, see vercel.json.
@Controller("internal/reminders")
export class RemindersController {
  constructor(
    private readonly sendDueTomorrowRemindersUseCase: SendDueTomorrowRemindersUseCase,
  ) {}

  @Public()
  @UseGuards(CronAuthGuard)
  @Get("due-tomorrow")
  @HttpCode(200)
  async run() {
    return this.sendDueTomorrowRemindersUseCase.execute();
  }
}
