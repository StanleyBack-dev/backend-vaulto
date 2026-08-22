import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  MARKETING_EMAIL_REPOSITORY,
  type MarketingEmailRepositoryPort,
} from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type MarketingEmailCooldownResult = {
  blocked: boolean;
  nextAllowedAt: Date | null;
};

// Lets the compose form warn the admin before they fill out the whole form
// — the send mutation re-checks this same window server-side regardless,
// so this is UX-only, never the source of truth.
@Injectable()
export class GetMarketingEmailRecipientCooldownUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(MARKETING_EMAIL_REPOSITORY)
    private readonly marketingEmailRepository: MarketingEmailRepositoryPort,
  ) {}

  async execute(
    adminId: string,
    email: string,
  ): Promise<MarketingEmailCooldownResult> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.READ_MARKETING_EMAILS,
    );

    const normalizedEmail = email.trim().toLowerCase();
    const mostRecentSend =
      await this.marketingEmailRepository.findMostRecentSendForEmail(
        normalizedEmail,
      );

    if (!mostRecentSend) {
      return { blocked: false, nextAllowedAt: null };
    }

    const nextAllowedAt = new Date(
      mostRecentSend.createdAt.getTime() + COOLDOWN_MS,
    );

    if (nextAllowedAt <= new Date()) {
      return { blocked: false, nextAllowedAt: null };
    }

    return { blocked: true, nextAllowedAt };
  }
}
