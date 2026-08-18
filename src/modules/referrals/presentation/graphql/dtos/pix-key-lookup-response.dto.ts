import { Field, ObjectType } from "@nestjs/graphql";
import type { PixKeyLookupResult } from "@/modules/referrals/application/use-cases/lookup-referral-withdrawal-pix-key.use-case";

@ObjectType()
export class PixKeyLookupResponseDto {
  static fromResult(result: PixKeyLookupResult): PixKeyLookupResponseDto {
    const dto = new PixKeyLookupResponseDto();
    dto.bankName = result.bankName;
    dto.ownerName = result.ownerName;
    dto.ownerDocument = result.ownerDocument;
    return dto;
  }

  @Field()
  bankName!: string;

  @Field()
  ownerName!: string;

  @Field()
  ownerDocument!: string;
}
