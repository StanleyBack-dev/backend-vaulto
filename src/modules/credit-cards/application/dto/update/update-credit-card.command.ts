export type UpdateCreditCardCommand = {
  idCreditCard: string;
  name: string;
  creditLimit: number;
  dueDay: number;
  closingDay: number;
  status: boolean;
};
