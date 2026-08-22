import type { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

export type SendMarketingEmailCommand = {
  category: MarketingEmailCategory;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  subject: string;
  bodyMarkdown: string;
  partnershipPercentage?: number;
};
