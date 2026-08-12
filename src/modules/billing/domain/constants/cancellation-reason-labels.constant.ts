import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  [CancellationReason.DOES_NOT_MEET_NEEDS]:
    "Não atende mais minhas necessidades",
  [CancellationReason.TOO_EXPENSIVE]:
    "Muito caro / falta de dinheiro no momento",
  [CancellationReason.FOUND_ALTERNATIVE]: "Encontrei uma alternativa melhor",
  [CancellationReason.HARD_TO_USE]: "Difícil de usar",
  [CancellationReason.MISSING_FEATURES]:
    "Faltam funcionalidades que eu precisava",
  [CancellationReason.TEMPORARY_USE]: "Uso apenas temporariamente",
  [CancellationReason.TECHNICAL_ISSUES]: "Problemas técnicos / bugs",
  [CancellationReason.OTHER]: "Outro motivo",
};
