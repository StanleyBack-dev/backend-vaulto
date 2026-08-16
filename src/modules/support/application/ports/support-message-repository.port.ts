import type { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import type { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

export type CreateSupportMessagePayload = {
  idUsers: string;
  category: SupportCategory;
  message: string;
  createdAt: Date;
};

export type SupportMessageView = {
  category: SupportCategory;
  message: string;
  createdAt: Date;
};

export type SupportTicketView = {
  idSupportMessage: string;
  idUsers: string;
  protocolNumber: number;
  category: SupportCategory;
  message: string;
  status: SupportTicketStatus;
  adminReply?: string;
  repliedAt?: Date;
  repliedByAdminId?: string;
  finalizedAt?: Date;
  finalizedByAdminId?: string;
  createdAt: Date;
};

export type ListSupportTicketsFilters = {
  status?: SupportTicketStatus;
  category?: SupportCategory;
};

export type ListSupportTicketsParams = {
  page: number;
  limit: number;
  filters?: ListSupportTicketsFilters;
};

export type ListSupportTicketsResult = {
  records: SupportTicketView[];
  total: number;
};

export type ReplyToSupportTicketPayload = {
  idSupportMessage: string;
  adminReply: string;
  repliedAt: Date;
  repliedByAdminId: string;
};

export interface SupportMessageRepositoryPort {
  create(payload: CreateSupportMessagePayload): Promise<SupportMessageView>;
  hasMessageSince(idUsers: string, since: Date): Promise<boolean>;
  findTicketById(idSupportMessage: string): Promise<SupportTicketView | null>;
  listTicketsPaginated(
    params: ListSupportTicketsParams,
  ): Promise<ListSupportTicketsResult>;
  reply(payload: ReplyToSupportTicketPayload): Promise<SupportTicketView>;
  finalize(
    idSupportMessage: string,
    finalizedByAdminId: string,
  ): Promise<SupportTicketView>;
}

export const SUPPORT_MESSAGE_REPOSITORY = Symbol("SUPPORT_MESSAGE_REPOSITORY");
