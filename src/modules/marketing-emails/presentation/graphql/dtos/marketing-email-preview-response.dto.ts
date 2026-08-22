import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class MarketingEmailPreviewResponseDto {
  static fromResult(result: {
    html: string;
  }): MarketingEmailPreviewResponseDto {
    const dto = new MarketingEmailPreviewResponseDto();
    dto.html = result.html;
    return dto;
  }

  @Field()
  html!: string;
}
