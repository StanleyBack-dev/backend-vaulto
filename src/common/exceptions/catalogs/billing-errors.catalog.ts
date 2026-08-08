import { HttpStatus } from "@nestjs/common";
import type { PlanLimitParams } from "./catalog-params.type";

export const billingErrors = {
  planLimitReached: {
    code: "BILLING_PLAN_LIMIT_REACHED",
    status: HttpStatus.FORBIDDEN,
    message: ({ resource, limit }: PlanLimitParams) =>
      `Limite do plano Free atingido (${limit}) para ${resource}. Assine o Vaulto Pro para continuar sem limites.`,
  },
  gatewayNotConfigured: {
    code: "BILLING_GATEWAY_NOT_CONFIGURED",
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: "Integração de pagamento não configurada.",
  },
  gatewayRequestFailed: {
    code: "BILLING_GATEWAY_REQUEST_FAILED",
    status: HttpStatus.BAD_GATEWAY,
    message:
      "Não foi possível concluir a solicitação junto ao provedor de pagamento.",
  },
  alreadySubscribed: {
    code: "BILLING_ALREADY_SUBSCRIBED",
    status: HttpStatus.CONFLICT,
    message: "Usuário já possui uma assinatura Pro ativa.",
  },
  noActiveSubscriptionToCancel: {
    code: "BILLING_NO_ACTIVE_SUBSCRIPTION_TO_CANCEL",
    status: HttpStatus.CONFLICT,
    message: "Usuário não possui uma assinatura Pro ativa para cancelar.",
  },
  invalidWebhookToken: {
    code: "BILLING_INVALID_WEBHOOK_TOKEN",
    status: HttpStatus.UNAUTHORIZED,
    message: "Token de webhook inválido.",
  },
  invalidCronToken: {
    code: "BILLING_INVALID_CRON_TOKEN",
    status: HttpStatus.UNAUTHORIZED,
    message: "Token de execução inválido.",
  },
} as const;
