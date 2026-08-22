import { Field, ObjectType } from "@nestjs/graphql";
import type { ExportMarketingEmailSendsOutput } from "@/modules/marketing-emails/application/use-cases/export-marketing-email-sends.use-case";

@ObjectType()
export class MarketingEmailSendsExportResponseDto {
  static fromOutput(
    output: ExportMarketingEmailSendsOutput,
  ): MarketingEmailSendsExportResponseDto {
    const dto = new MarketingEmailSendsExportResponseDto();
    dto.filename = output.filename;
    dto.mimeType = output.mimeType;
    dto.base64 = output.base64;
    return dto;
  }

  @Field()
  filename!: string;

  @Field()
  mimeType!: string;

  @Field()
  base64!: string;
}
