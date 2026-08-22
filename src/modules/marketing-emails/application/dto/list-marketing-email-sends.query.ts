import type { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

export type ListMarketingEmailSendsQuery = {
  page?: number;
  limit?: number;
  category?: MarketingEmailCategory;
  recipientEmail?: string;
};
