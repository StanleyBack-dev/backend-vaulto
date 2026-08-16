import type { SupportTicketView } from "@/modules/support/application/ports/support-message-repository.port";

export interface SupportTicketAdminView extends SupportTicketView {
  userName: string;
  userEmail: string;
  finalizedByName?: string;
}
