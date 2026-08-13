import { HttpStatus } from "@nestjs/common";

export const supportErrors = {
  messageRequired: {
    code: "SUPPORT_MESSAGE_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Escreva uma mensagem antes de enviar.",
  },
  dailyLimitReached: {
    code: "SUPPORT_DAILY_LIMIT_REACHED",
    status: HttpStatus.CONFLICT,
    message:
      "Você já enviou uma mensagem de suporte hoje. Tente novamente amanhã.",
  },
} as const;
