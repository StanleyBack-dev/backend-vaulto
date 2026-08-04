import type { CreateCreditCardCommand } from "@/modules/credit-cards/application/dto/create/create-credit-card.command";
import type { ListCreditCardsQuery } from "@/modules/credit-cards/application/dto/get/list-credit-cards.query";
import type { UpdateCreditCardCommand } from "@/modules/credit-cards/application/dto/update/update-credit-card.command";

export type CreditCardView = {
  idCreditCard: string;
  idUsers: string;
  name: string;
  creditLimit: number;
  dueDay: number;
  closingDay: number;
  status: boolean;
  usedLimit: number;
  availableLimit: number;
  inactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCreditCardPayload = CreateCreditCardCommand & {
  idUsers: string;
};

export type UpdateCreditCardPayload = UpdateCreditCardCommand & {
  idUsers: string;
};

export interface CreditCardRepositoryPort {
  create(payload: CreateCreditCardPayload): Promise<CreditCardView>;
  update(payload: UpdateCreditCardPayload): Promise<CreditCardView>;
  findById(
    idUsers: string,
    idCreditCard: string,
  ): Promise<CreditCardView | null>;
  findByName(idUsers: string, name: string): Promise<CreditCardView | null>;
  listByUser(
    idUsers: string,
    query?: ListCreditCardsQuery,
  ): Promise<{ records: CreditCardView[]; total: number }>;
}

export const CREDIT_CARD_REPOSITORY = Symbol("CREDIT_CARD_REPOSITORY");
