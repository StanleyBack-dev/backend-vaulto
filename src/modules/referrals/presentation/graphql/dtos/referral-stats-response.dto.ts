import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { ReferralStatsResult } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import { ReferralRewardStatus } from "@/modules/referrals/domain/enums/referral-reward-status.enum";

@ObjectType()
export class ReferralStatsResponseDto {
  static fromResult(result: ReferralStatsResult): ReferralStatsResponseDto {
    const dto = new ReferralStatsResponseDto();
    dto.referralCode = result.referralCode;
    dto.qualifiedReferralsCount = result.qualifiedReferralsCount;
    dto.thresholdCount = result.thresholdCount;
    dto.rewardStatus = result.rewardStatus ?? undefined;
    return dto;
  }

  @Field()
  referralCode!: string;

  @Field(() => Int)
  qualifiedReferralsCount!: number;

  @Field(() => Int)
  thresholdCount!: number;

  @Field(() => ReferralRewardStatus, { nullable: true })
  rewardStatus?: ReferralRewardStatus;
}
