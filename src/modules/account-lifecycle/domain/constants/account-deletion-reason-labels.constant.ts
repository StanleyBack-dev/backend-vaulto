import { AccountDeletionReason } from "@/modules/account-lifecycle/domain/enums/account-deletion-reason.enum";

export const ACCOUNT_DELETION_REASON_LABELS: Record<
  AccountDeletionReason,
  string
> = {
  [AccountDeletionReason.NOT_USING_ANYMORE]: "Não estou usando mais",
  [AccountDeletionReason.PRIVACY_CONCERNS]: "Preocupações com privacidade",
  [AccountDeletionReason.FOUND_ALTERNATIVE]: "Encontrei uma alternativa melhor",
  [AccountDeletionReason.HARD_TO_USE]: "Difícil de usar",
  [AccountDeletionReason.TECHNICAL_ISSUES]: "Problemas técnicos / bugs",
  [AccountDeletionReason.OTHER]: "Outro motivo",
};
