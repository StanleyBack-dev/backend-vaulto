import { Field, Float, InputType } from "@nestjs/graphql";
import { IsEmail } from "class-validator";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";

@InputType()
export class SendMarketingEmailInputDto {
  @Field(() => MarketingEmailCategory)
  category!: MarketingEmailCategory;

  @Field()
  @IsEmail({}, { message: "Informe um email válido." })
  recipientEmail!: string;

  @Field()
  recipientName!: string;

  @Field({ nullable: true })
  recipientPhone?: string;

  @Field({ nullable: true })
  socialMediaLink?: string;

  @Field()
  subject!: string;

  @Field()
  bodyMarkdown!: string;

  @Field(() => Float, { nullable: true })
  partnershipPercentage?: number;
}
