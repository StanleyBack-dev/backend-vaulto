import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { ReferralStatsResult } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";

@ObjectType()
export class ReferralStatsResponseDto {
  static fromResult(result: ReferralStatsResult): ReferralStatsResponseDto {
    const dto = new ReferralStatsResponseDto();
    dto.referralCode = result.referralCode;
    dto.qualifiedReferralsCount = result.qualifiedReferralsCount;
    dto.creditAmountCents = result.creditAmountCents;
    dto.minWithdrawalCents = result.minWithdrawalCents;
    dto.creditHoldDays = result.creditHoldDays;
    dto.availableBalanceCents = result.availableBalanceCents;
    dto.pendingHoldBalanceCents = result.pendingHoldBalanceCents;
    return dto;
  }

  @Field()
  referralCode!: string;

  @Field(() => Int)
  qualifiedReferralsCount!: number;

  @Field(() => Int)
  creditAmountCents!: number;

  @Field(() => Int)
  minWithdrawalCents!: number;

  @Field(() => Int)
  creditHoldDays!: number;

  @Field(() => Int)
  availableBalanceCents!: number;

  @Field(() => Int)
  pendingHoldBalanceCents!: number;
}
