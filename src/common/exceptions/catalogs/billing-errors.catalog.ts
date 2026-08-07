import { HttpStatus } from "@nestjs/common";
import type { PlanLimitParams } from "./catalog-params.type";

export const billingErrors = {
  planLimitReached: {
    code: "BILLING_PLAN_LIMIT_REACHED",
    status: HttpStatus.FORBIDDEN,
    message: ({ resource, limit }: PlanLimitParams) =>
      `Limite do plano Free atingido (${limit}) para ${resource}. Assine o Vaulto Pro para continuar sem limites.`,
  },
} as const;
