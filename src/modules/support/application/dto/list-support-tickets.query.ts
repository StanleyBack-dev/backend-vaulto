import type { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import type { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

export interface ListSupportTicketsQuery {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
  category?: SupportCategory;
}
