import type { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

export type CreateMarketingEmailSendPayload = {
  category: MarketingEmailCategory;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  subject: string;
  bodyMarkdown: string;
  partnershipPercentage?: number;
  sentByAdminId: string;
  createdAt: Date;
};

export type MarketingEmailSendView = {
  idMarketingEmailSend: string;
  category: MarketingEmailCategory;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  subject: string;
  bodyMarkdown: string;
  partnershipPercentage?: number;
  sentByAdminId: string;
  createdAt: Date;
};

export type ListMarketingEmailSendsFilters = {
  category?: MarketingEmailCategory;
  recipientEmail?: string;
};

export type ListMarketingEmailSendsParams = {
  page: number;
  limit: number;
  filters?: ListMarketingEmailSendsFilters;
};

export type ListMarketingEmailSendsResult = {
  records: MarketingEmailSendView[];
  total: number;
};

export interface MarketingEmailRepositoryPort {
  create(
    payload: CreateMarketingEmailSendPayload,
  ): Promise<MarketingEmailSendView>;
  findMostRecentSendForEmail(
    recipientEmail: string,
  ): Promise<MarketingEmailSendView | null>;
  listPaginated(
    params: ListMarketingEmailSendsParams,
  ): Promise<ListMarketingEmailSendsResult>;
  listAll(
    filters?: ListMarketingEmailSendsFilters,
  ): Promise<MarketingEmailSendView[]>;
}

export const MARKETING_EMAIL_REPOSITORY = Symbol("MARKETING_EMAIL_REPOSITORY");
