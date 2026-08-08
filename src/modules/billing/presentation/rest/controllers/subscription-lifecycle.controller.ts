import { Controller, Get, Headers, HttpCode } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { Public } from "@/common/decorators/public.decorator";
import { RunSubscriptionLifecycleUseCase } from "@/modules/billing/application/use-cases/lifecycle/run-subscription-lifecycle.use-case";

// Triggered daily by a Vercel Cron Job (see vercel.json) rather than an
// in-process scheduler: the backend runs as a serverless function, so
// there is no long-lived process for a @nestjs/schedule-style timer to
// live in between requests.
@Controller("internal/billing")
export class SubscriptionLifecycleController {
  constructor(
    private readonly runSubscriptionLifecycleUseCase: RunSubscriptionLifecycleUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get("subscription-lifecycle")
  @HttpCode(200)
  async run(@Headers("authorization") authorization: string | undefined) {
    this.assertValidToken(authorization);
    return this.runSubscriptionLifecycleUseCase.execute();
  }

  private assertValidToken(authorization?: string): void {
    const expectedToken = this.configService.get<string>("CRON_SECRET");
    const receivedToken = authorization?.replace(/^Bearer\s+/i, "");

    if (!expectedToken || receivedToken !== expectedToken) {
      throw AppException.from(APP_ERRORS.billing.invalidCronToken, undefined);
    }
  }
}
