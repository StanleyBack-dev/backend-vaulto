import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { MarketingEmailSendAdminView } from "@/modules/marketing-emails/application/dto/marketing-email-send-admin-view.type";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

@ObjectType()
export class MarketingEmailSendResponseDto {
  static fromView(
    view: MarketingEmailSendAdminView,
  ): MarketingEmailSendResponseDto {
    const dto = new MarketingEmailSendResponseDto();
    dto.idMarketingEmailSend = view.idMarketingEmailSend;
    dto.category = view.category;
    dto.recipientEmail = view.recipientEmail;
    dto.recipientName = view.recipientName;
    dto.recipientPhone = view.recipientPhone;
    dto.socialMediaLink = view.socialMediaLink;
    dto.subject = view.subject;
    dto.partnershipPercentage = view.partnershipPercentage;
    dto.sentByAdminName = view.sentByAdminName;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field()
  idMarketingEmailSend!: string;

  @Field(() => MarketingEmailCategory)
  category!: MarketingEmailCategory;

  @Field()
  recipientEmail!: string;

  @Field()
  recipientName!: string;

  @Field(() => String, { nullable: true })
  recipientPhone?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaLink?: string | null;

  @Field()
  subject!: string;

  @Field(() => Float, { nullable: true })
  partnershipPercentage?: number;

  @Field()
  sentByAdminName!: string;

  @Field(() => Date)
  createdAt!: Date;
}
