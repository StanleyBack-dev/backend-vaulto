import type { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

export type CreateSupportMessagePayload = {
  idUsers: string;
  category: SupportCategory;
  message: string;
  createdAt: Date;
};

export type SupportMessageView = {
  category: SupportCategory;
  message: string;
  createdAt: Date;
};

export interface SupportMessageRepositoryPort {
  create(payload: CreateSupportMessagePayload): Promise<SupportMessageView>;
  hasMessageSince(idUsers: string, since: Date): Promise<boolean>;
}

export const SUPPORT_MESSAGE_REPOSITORY = Symbol("SUPPORT_MESSAGE_REPOSITORY");
