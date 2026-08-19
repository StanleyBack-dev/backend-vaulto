import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { CronAuthGuard } from "@/common/guards/cron-auth.guard";
import { PromoteReferralCreditsUseCase } from "@/modules/referrals/application/use-cases/promote-referral-credits.use-case";

// Triggered daily by a Vercel Cron Job — see vercel.json.
@Controller("internal/referrals")
export class ReferralCreditsController {
  constructor(
    private readonly promoteReferralCreditsUseCase: PromoteReferralCreditsUseCase,
  ) {}

  @Public()
  @UseGuards(CronAuthGuard)
  @Get("promote-credits")
  @HttpCode(200)
  async run() {
    return this.promoteReferralCreditsUseCase.execute();
  }
}
