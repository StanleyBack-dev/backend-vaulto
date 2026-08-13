import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { CronAuthGuard } from "@/common/guards/cron-auth.guard";
import { ProcessAccountDeletionsUseCase } from "@/modules/account-lifecycle/application/use-cases/process-account-deletions.use-case";

// Triggered daily by a Vercel Cron Job, see vercel.json.
@Controller("internal/users")
export class AccountDeletionsController {
  constructor(
    private readonly processAccountDeletionsUseCase: ProcessAccountDeletionsUseCase,
  ) {}

  @Public()
  @UseGuards(CronAuthGuard)
  @Get("process-account-deletions")
  @HttpCode(200)
  async run() {
    return this.processAccountDeletionsUseCase.execute();
  }
}
