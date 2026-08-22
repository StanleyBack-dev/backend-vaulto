import type { MarketingEmailSendView } from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";

export type MarketingEmailSendAdminView = MarketingEmailSendView & {
  sentByAdminName: string;
};
