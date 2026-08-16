import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";
import type { Request } from "express";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

// Guards internal REST endpoints triggered by a Vercel Cron Job (see
// vercel.json) rather than an in-process scheduler: the backend runs as a
// serverless function, so there is no long-lived process for a
// @nestjs/schedule-style timer to live in between requests.
@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedToken = this.configService.get<string>("CRON_SECRET");
    const receivedToken = request.headers.authorization?.replace(
      /^Bearer\s+/i,
      "",
    );

    if (
      !expectedToken ||
      !receivedToken ||
      !this.tokensMatch(receivedToken, expectedToken)
    ) {
      throw AppException.from(APP_ERRORS.internal.invalidCronToken, undefined);
    }

    return true;
  }

  // Same reasoning as the Asaas webhook token: a plain !== comparison leaks
  // how many characters matched through response timing, and this token is
  // the only thing standing between the public internet and triggering the
  // internal cron endpoints (subscription lifecycle, account deletions,
  // reminders, referral rewards) on demand.
  private tokensMatch(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  }
}
