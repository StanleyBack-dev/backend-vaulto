import { Field, ObjectType } from "@nestjs/graphql";
import type { MarketingEmailCooldownResult } from "@/modules/marketing-emails/application/use-cases/get-marketing-email-recipient-cooldown.use-case";

@ObjectType()
export class MarketingEmailCooldownResponseDto {
  static fromResult(
    result: MarketingEmailCooldownResult,
  ): MarketingEmailCooldownResponseDto {
    const dto = new MarketingEmailCooldownResponseDto();
    dto.blocked = result.blocked;
    dto.nextAllowedAt = result.nextAllowedAt ?? undefined;
    return dto;
  }

  @Field()
  blocked!: boolean;

  @Field(() => Date, { nullable: true })
  nextAllowedAt?: Date;
}
