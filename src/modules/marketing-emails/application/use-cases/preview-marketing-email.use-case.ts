import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { buildPartnerOutreachEmail } from "@/modules/marketing-emails/presentation/templates/partner-outreach-email.template";

export type PreviewMarketingEmailInput = {
  subject: string;
  bodyMarkdown: string;
  recipientName?: string;
  partnershipPercentage?: number;
};

// Runs the exact same rendering pipeline as SendMarketingEmailUseCase so the
// admin's live preview is never out of sync with what actually gets sent.
@Injectable()
export class PreviewMarketingEmailUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    adminId: string,
    input: PreviewMarketingEmailInput,
  ): Promise<{ html: string }> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.READ_MARKETING_EMAILS,
    );

    const appUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    const emailTemplate = buildPartnerOutreachEmail({
      appUrl,
      subject: input.subject.trim() || "(sem assunto)",
      bodyMarkdown: input.bodyMarkdown,
      recipientName: input.recipientName,
      partnershipPercentage: input.partnershipPercentage,
    });

    return { html: emailTemplate.html };
  }
}
