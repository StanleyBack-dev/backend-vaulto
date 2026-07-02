import type { AccountType } from "@/modules/accounts/domain/enums/account-type.enum";
import type { CreateAccountCommand } from "@/modules/accounts/application/dto/create/create-account.command";
import type { TransferBetweenAccountsCommand } from "@/modules/accounts/application/dto/transfer/transfer-between-accounts.command";

export type CreateAccountPayload = CreateAccountCommand & {
  idUsers: string;
};

export type AccountView = {
  idAccount: string;
  idUsers: string;
  name: string;
  accountType: AccountType;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TransferBetweenAccountsPayload = TransferBetweenAccountsCommand & {
  idUsers: string;
};

export type AccountTransferView = {
  idAccountTransfer: string;
  idUsers: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
  transferredAt: Date;
  createdAt: Date;
};

export type TransferBetweenAccountsResult = {
  sourceAccount: AccountView;
  destinationAccount: AccountView;
  transfer: AccountTransferView;
};

export interface AccountRepositoryPort {
  create(payload: CreateAccountPayload): Promise<AccountView>;
  listByUser(idUsers: string): Promise<AccountView[]>;
  findByIdAndUser(idUsers: string, idAccount: string): Promise<AccountView | null>;
  transferBetweenAccounts(
    payload: TransferBetweenAccountsPayload,
  ): Promise<TransferBetweenAccountsResult>;
}

export const ACCOUNT_REPOSITORY = Symbol("ACCOUNT_REPOSITORY");
