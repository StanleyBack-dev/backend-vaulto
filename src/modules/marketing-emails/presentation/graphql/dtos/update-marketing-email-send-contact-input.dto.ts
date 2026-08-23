import { Field, InputType } from "@nestjs/graphql";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

@InputType()
export class UpdateMarketingEmailSendContactInputDto {
  @Field()
  idMarketingEmailSend!: string;

  @Field({ nullable: true })
  recipientName?: string;

  @Field(() => MarketingEmailCategory, { nullable: true })
  category?: MarketingEmailCategory;

  @Field({ nullable: true })
  recipientPhone?: string;

  @Field({ nullable: true })
  socialMediaLink?: string;
}
