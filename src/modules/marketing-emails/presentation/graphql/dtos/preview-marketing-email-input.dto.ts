import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class PreviewMarketingEmailInputDto {
  @Field()
  subject!: string;

  @Field()
  bodyMarkdown!: string;

  @Field({ nullable: true })
  recipientName?: string;

  @Field(() => Float, { nullable: true })
  partnershipPercentage?: number;
}
