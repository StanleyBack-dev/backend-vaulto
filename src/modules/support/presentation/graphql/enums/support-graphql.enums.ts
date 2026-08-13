import { registerEnumType } from "@nestjs/graphql";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

registerEnumType(SupportCategory, {
  name: "SupportCategory",
});

registerEnumType(SupportTicketStatus, {
  name: "SupportTicketStatus",
});
