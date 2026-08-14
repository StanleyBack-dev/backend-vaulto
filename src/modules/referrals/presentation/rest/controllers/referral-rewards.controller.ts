import { Controller, Get, HttpCode, UseGuards } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { CronAuthGuard } from "@/common/guards/cron-auth.guard";
import { ApplyReferralRewardsUseCase } from "@/modules/referrals/application/use-cases/apply-referral-rewards.use-case";

// Triggered daily by a Vercel Cron Job, scheduled ahead of
// /internal/billing/subscription-lifecycle — see vercel.json.
@Controller("internal/referrals")
export class ReferralRewardsController {
  constructor(
    private readonly applyReferralRewardsUseCase: ApplyReferralRewardsUseCase,
  ) {}

  @Public()
  @UseGuards(CronAuthGuard)
  @Get("apply-rewards")
  @HttpCode(200)
  async run() {
    return this.applyReferralRewardsUseCase.execute();
  }
}
