import { registerEnumType } from "@nestjs/graphql";
import { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

registerEnumType(PixKeyType, {
  name: "PixKeyType",
});

registerEnumType(ReferralWithdrawalStatus, {
  name: "ReferralWithdrawalStatus",
});
