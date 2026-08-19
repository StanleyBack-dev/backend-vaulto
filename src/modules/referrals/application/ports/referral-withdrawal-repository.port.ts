import type { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";
import type { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

export type ReferralWithdrawalView = {
  idReferralWithdrawal: string;
  idUsers: string;
  amountCents: number;
  pixKey: string;
  pixKeyType: PixKeyType;
  status: ReferralWithdrawalStatus;
  gatewayTransferId?: string;
  failReason?: string | null;
  requestedAt: Date;
  processedAt?: Date | null;
};

export type CreateReferralWithdrawalPayload = {
  idUsers: string;
  amountCents: number;
  pixKey: string;
  pixKeyType: PixKeyType;
  requestedAt: Date;
};

export type UpdateReferralWithdrawalPayload = {
  status?: ReferralWithdrawalStatus;
  gatewayTransferId?: string;
  failReason?: string | null;
  processedAt?: Date | null;
};

export interface ReferralWithdrawalRepositoryPort {
  create(
    payload: CreateReferralWithdrawalPayload,
  ): Promise<ReferralWithdrawalView>;
  update(
    idReferralWithdrawal: string,
    payload: UpdateReferralWithdrawalPayload,
  ): Promise<ReferralWithdrawalView>;
  findByUser(idUsers: string): Promise<ReferralWithdrawalView[]>;
  findByGatewayTransferId(
    gatewayTransferId: string,
  ): Promise<ReferralWithdrawalView | null>;
  sumActiveForUser(idUsers: string): Promise<number>;
}

export const REFERRAL_WITHDRAWAL_REPOSITORY = Symbol(
  "REFERRAL_WITHDRAWAL_REPOSITORY",
);
