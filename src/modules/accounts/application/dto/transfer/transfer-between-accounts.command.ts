export type TransferBetweenAccountsCommand = {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
  transferredAt?: Date;
};
