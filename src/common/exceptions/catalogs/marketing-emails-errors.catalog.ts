import { HttpStatus } from "@nestjs/common";
import { formatDateBR } from "@/utils/pdf";
import type { MarketingEmailCooldownParams } from "./catalog-params.type";

export const marketingEmailsErrors = {
  recipientCooldownActive: {
    code: "MARKETING_EMAIL_RECIPIENT_COOLDOWN_ACTIVE",
    status: HttpStatus.CONFLICT,
    message: ({ nextAllowedAt }: MarketingEmailCooldownParams) =>
      `Já enviamos um e-mail de parceria para esse contato nos últimos 7 dias. Só será possível reenviar a partir de ${formatDateBR(nextAllowedAt)}.`,
  },
  subjectRequired: {
    code: "MARKETING_EMAIL_SUBJECT_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Informe o assunto do e-mail antes de enviar.",
  },
  bodyRequired: {
    code: "MARKETING_EMAIL_BODY_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Escreva o conteúdo do e-mail antes de enviar.",
  },
  sendFailed: {
    code: "MARKETING_EMAIL_SEND_FAILED",
    status: HttpStatus.BAD_GATEWAY,
    message: "Não foi possível enviar o e-mail. Tente novamente.",
  },
} as const;
