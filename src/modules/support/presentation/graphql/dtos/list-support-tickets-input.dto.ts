import { Field, InputType, Int } from "@nestjs/graphql";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

@InputType()
export class ListSupportTicketsInputDto {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => SupportTicketStatus, { nullable: true })
  status?: SupportTicketStatus;

  @Field(() => SupportCategory, { nullable: true })
  category?: SupportCategory;
}
