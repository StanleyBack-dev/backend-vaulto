import type { AccountDeactivationReason } from "@/modules/account-lifecycle/domain/enums/account-deactivation-reason.enum";

export type CreateAccountDeactivationPayload = {
  idUsers: string;
  reasons: AccountDeactivationReason[];
  otherReason?: string;
  deactivatedAt: Date;
};

export interface AccountDeactivationRepositoryPort {
  create(payload: CreateAccountDeactivationPayload): Promise<void>;
}

export const ACCOUNT_DEACTIVATION_REPOSITORY = Symbol(
  "ACCOUNT_DEACTIVATION_REPOSITORY",
);
