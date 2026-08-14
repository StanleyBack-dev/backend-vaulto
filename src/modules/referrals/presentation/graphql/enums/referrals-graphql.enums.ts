import { registerEnumType } from "@nestjs/graphql";
import { ReferralRewardStatus } from "@/modules/referrals/domain/enums/referral-reward-status.enum";

registerEnumType(ReferralRewardStatus, {
  name: "ReferralRewardStatus",
});
