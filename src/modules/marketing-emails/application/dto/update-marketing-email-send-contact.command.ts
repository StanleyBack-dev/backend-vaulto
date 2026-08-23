import type { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

export type UpdateMarketingEmailSendContactCommand = {
  idMarketingEmailSend: string;
  recipientName?: string;
  category?: MarketingEmailCategory;
  recipientPhone?: string;
  socialMediaLink?: string;
};
