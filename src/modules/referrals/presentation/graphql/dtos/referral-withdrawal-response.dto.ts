import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { ReferralWithdrawalView } from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

@ObjectType()
export class ReferralWithdrawalResponseDto {
  static fromView(
    view: ReferralWithdrawalView,
  ): ReferralWithdrawalResponseDto {
    const dto = new ReferralWithdrawalResponseDto();
    dto.idReferralWithdrawal = view.idReferralWithdrawal;
    dto.amountCents = view.amountCents;
    dto.status = view.status;
    dto.requestedAt = view.requestedAt;
    dto.processedAt = view.processedAt ?? undefined;
    return dto;
  }

  @Field()
  idReferralWithdrawal!: string;

  @Field(() => Int)
  amountCents!: number;

  @Field(() => ReferralWithdrawalStatus)
  status!: ReferralWithdrawalStatus;

  @Field()
  requestedAt!: Date;

  @Field({ nullable: true })
  processedAt?: Date;
}
