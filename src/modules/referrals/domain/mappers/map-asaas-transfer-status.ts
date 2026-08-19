import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

// Asaas' PENDING/BANK_PROCESSING both mean "accepted, in flight" for a Pix
// transfer (which otherwise settles near-instantly) — treated as PROCESSING
// here rather than a distinct status, since the withdrawal history doesn't
// need to distinguish them.
export function mapAsaasTransferStatus(
  gatewayStatus: string,
): ReferralWithdrawalStatus {
  if (gatewayStatus === "DONE") {
    return ReferralWithdrawalStatus.COMPLETED;
  }

  if (gatewayStatus === "CANCELLED" || gatewayStatus === "FAILED") {
    return ReferralWithdrawalStatus.FAILED;
  }

  return ReferralWithdrawalStatus.PROCESSING;
}
