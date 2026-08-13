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
  ticketNotFound: {
    code: "SUPPORT_TICKET_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Chamado de suporte não encontrado.",
  },
  replyRequired: {
    code: "SUPPORT_TICKET_REPLY_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Escreva uma resposta antes de enviar.",
  },
} as const;
