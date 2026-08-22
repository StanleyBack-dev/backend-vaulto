import { Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  DEFAULT_PARTNER_OUTREACH_EMAIL_BODY_MARKDOWN,
  DEFAULT_PARTNER_OUTREACH_EMAIL_SUBJECT,
} from "@/modules/marketing-emails/presentation/templates/default-partner-outreach-email.constant";

export type MarketingEmailDefaultTemplateResult = {
  subject: string;
  bodyMarkdown: string;
};

@Injectable()
export class GetMarketingEmailDefaultTemplateUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(
    adminId: string,
  ): Promise<MarketingEmailDefaultTemplateResult> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.READ_MARKETING_EMAILS,
    );

    return {
      subject: DEFAULT_PARTNER_OUTREACH_EMAIL_SUBJECT,
      bodyMarkdown: DEFAULT_PARTNER_OUTREACH_EMAIL_BODY_MARKDOWN,
    };
  }
}
