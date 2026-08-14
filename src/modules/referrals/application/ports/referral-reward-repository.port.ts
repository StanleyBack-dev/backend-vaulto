import type { ReferralRewardStatus } from "@/modules/referrals/domain/enums/referral-reward-status.enum";

export type ReferralRewardView = {
  idReferralReward: string;
  idUsers: string;
  status: ReferralRewardStatus;
  grantedAt: Date;
  appliedAt?: Date | null;
};

export interface ReferralRewardRepositoryPort {
  existsForUser(idUsers: string): Promise<boolean>;
  findByUser(idUsers: string): Promise<ReferralRewardView | null>;
  create(idUsers: string, grantedAt: Date): Promise<void>;
  findPending(): Promise<ReferralRewardView[]>;
  markApplied(idReferralReward: string, appliedAt: Date): Promise<void>;
}

export const REFERRAL_REWARD_REPOSITORY = Symbol("REFERRAL_REWARD_REPOSITORY");
