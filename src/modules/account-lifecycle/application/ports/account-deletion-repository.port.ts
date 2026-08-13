import type { AccountDeletionReason } from "@/modules/account-lifecycle/domain/enums/account-deletion-reason.enum";

export type AccountDeletionView = {
  idAccountDeletion: string;
  idUsers: string;
  email: string;
  reasons: AccountDeletionReason[];
  otherReason?: string;
  requestedAt: Date;
  scheduledFor: Date;
  cancelledAt?: Date;
};

export type CreateAccountDeletionPayload = {
  idUsers: string;
  email: string;
  reasons: AccountDeletionReason[];
  otherReason?: string;
  requestedAt: Date;
  scheduledFor: Date;
};

export interface AccountDeletionRepositoryPort {
  create(payload: CreateAccountDeletionPayload): Promise<void>;
  findPendingByUserId(idUsers: string): Promise<AccountDeletionView | null>;
  markCancelled(idAccountDeletion: string, cancelledAt: Date): Promise<void>;
  findDueForExecution(now: Date): Promise<AccountDeletionView[]>;
}

export const ACCOUNT_DELETION_REPOSITORY = Symbol(
  "ACCOUNT_DELETION_REPOSITORY",
);
