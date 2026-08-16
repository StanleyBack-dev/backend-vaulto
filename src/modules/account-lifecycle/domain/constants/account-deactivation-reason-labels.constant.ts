import { AccountDeactivationReason } from "@/modules/account-lifecycle/domain/enums/account-deactivation-reason.enum";

export const ACCOUNT_DEACTIVATION_REASON_LABELS: Record<
  AccountDeactivationReason,
  string
> = {
  [AccountDeactivationReason.NOT_USING_ANYMORE]: "Não estou usando mais",
  [AccountDeactivationReason.TAKING_A_BREAK]: "Quero pausar temporariamente",
  [AccountDeactivationReason.TOO_MANY_NOTIFICATIONS]:
    "Recebo notificações/e-mails demais",
  [AccountDeactivationReason.FOUND_ALTERNATIVE]:
    "Encontrei uma alternativa melhor",
  [AccountDeactivationReason.HARD_TO_USE]: "Difícil de usar",
  [AccountDeactivationReason.OTHER]: "Outro motivo",
};
