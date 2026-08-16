import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { SupportTicketAdminView } from "@/modules/support/application/dto/support-ticket-admin-view.type";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

@ObjectType()
export class SupportTicketResponseDto {
  static fromView(view: SupportTicketAdminView): SupportTicketResponseDto {
    const dto = new SupportTicketResponseDto();
    dto.idSupportMessage = view.idSupportMessage;
    dto.protocolNumber = view.protocolNumber;
    dto.userName = view.userName;
    dto.userEmail = view.userEmail;
    dto.category = view.category;
    dto.message = view.message;
    dto.status = view.status;
    dto.adminReply = view.adminReply;
    dto.repliedAt = view.repliedAt;
    dto.finalizedAt = view.finalizedAt;
    dto.finalizedByName = view.finalizedByName;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field()
  idSupportMessage!: string;

  @Field(() => Int)
  protocolNumber!: number;

  @Field()
  userName!: string;

  @Field()
  userEmail!: string;

  @Field(() => SupportCategory)
  category!: SupportCategory;

  @Field()
  message!: string;

  @Field(() => SupportTicketStatus)
  status!: SupportTicketStatus;

  @Field({ nullable: true })
  adminReply?: string;

  @Field(() => Date, { nullable: true })
  repliedAt?: Date;

  @Field(() => Date, { nullable: true })
  finalizedAt?: Date;

  @Field({ nullable: true })
  finalizedByName?: string;

  @Field(() => Date)
  createdAt!: Date;
}
