export type RegisterDebtPaymentCommand = {
  idDebt: string;
  amountPaid: number;
  paidAt?: Date;
};
