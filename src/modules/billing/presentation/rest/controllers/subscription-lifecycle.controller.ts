import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { CronAuthGuard } from "@/common/guards/cron-auth.guard";
import { RunSubscriptionLifecycleUseCase } from "@/modules/billing/application/use-cases/lifecycle/run-subscription-lifecycle.use-case";

// Triggered daily by a Vercel Cron Job, see vercel.json.
@Controller("internal/billing")
export class SubscriptionLifecycleController {
  constructor(
    private readonly runSubscriptionLifecycleUseCase: RunSubscriptionLifecycleUseCase,
  ) {}

  @Public()
  @UseGuards(CronAuthGuard)
  @Get("subscription-lifecycle")
  @HttpCode(200)
  async run() {
    return this.runSubscriptionLifecycleUseCase.execute();
  }
}
