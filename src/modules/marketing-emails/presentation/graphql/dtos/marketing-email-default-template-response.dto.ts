import { Field, ObjectType } from "@nestjs/graphql";
import type { MarketingEmailDefaultTemplateResult } from "@/modules/marketing-emails/application/use-cases/get-marketing-email-default-template.use-case";

@ObjectType()
export class MarketingEmailDefaultTemplateResponseDto {
  static fromResult(
    result: MarketingEmailDefaultTemplateResult,
  ): MarketingEmailDefaultTemplateResponseDto {
    const dto = new MarketingEmailDefaultTemplateResponseDto();
    dto.subject = result.subject;
    dto.bodyMarkdown = result.bodyMarkdown;
    return dto;
  }

  @Field()
  subject!: string;

  @Field()
  bodyMarkdown!: string;
}
