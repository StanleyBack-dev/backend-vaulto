import type { ReferralCreditStatus } from "@/modules/referrals/domain/enums/referral-credit-status.enum";

export type ReferralCreditView = {
  idReferralCredit: string;
  idUsers: string;
  idReferredUser: string;
  amountCents: number;
  status: ReferralCreditStatus;
  qualifiedAt: Date;
  availableAt: Date;
  clawedBackAt?: Date | null;
};

export type CreateReferralCreditPayload = {
  idUsers: string;
  idReferredUser: string;
  amountCents: number;
  qualifiedAt: Date;
  availableAt: Date;
};

export interface ReferralCreditRepositoryPort {
  create(payload: CreateReferralCreditPayload): Promise<ReferralCreditView>;
  findDueForPromotion(now: Date): Promise<ReferralCreditView[]>;
  findPendingByReferredUser(
    idReferredUser: string,
  ): Promise<ReferralCreditView | null>;
  markAvailable(idReferralCredit: string): Promise<void>;
  markClawedBack(idReferralCredit: string, clawedBackAt: Date): Promise<void>;
  sumAvailableForUser(idUsers: string): Promise<number>;
  sumPendingHoldForUser(idUsers: string): Promise<number>;
}

export const REFERRAL_CREDIT_REPOSITORY = Symbol("REFERRAL_CREDIT_REPOSITORY");
