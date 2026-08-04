export type CreateCreditCardCommand = {
  name: string;
  creditLimit: number;
  dueDay: number;
  closingDay: number;
  status?: boolean;
};
