import { Field, InputType, Int } from "@nestjs/graphql";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

@InputType()
export class ListMarketingEmailSendsInputDto {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => MarketingEmailCategory, { nullable: true })
  category?: MarketingEmailCategory;

  @Field({ nullable: true })
  recipientEmail?: string;
}
