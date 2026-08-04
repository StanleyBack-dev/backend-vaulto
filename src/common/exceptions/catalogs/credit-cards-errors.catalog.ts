import { HttpStatus } from "@nestjs/common";

export const creditCardsErrors = {
  notFound: {
    code: "CREDIT_CARDS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Cartao de credito nao encontrado.",
  },
  duplicatedName: {
    code: "CREDIT_CARDS_DUPLICATED_NAME",
    status: HttpStatus.CONFLICT,
    message: "Ja existe um cartao de credito com este nome.",
  },
  invalidLimit: {
    code: "CREDIT_CARDS_INVALID_LIMIT",
    status: HttpStatus.BAD_REQUEST,
    message: "Limite do cartao deve ser maior que zero.",
  },
  invalidDueDay: {
    code: "CREDIT_CARDS_INVALID_DUE_DAY",
    status: HttpStatus.BAD_REQUEST,
    message: "Dia de vencimento deve estar entre 1 e 31.",
  },
  invalidClosingDay: {
    code: "CREDIT_CARDS_INVALID_CLOSING_DAY",
    status: HttpStatus.BAD_REQUEST,
    message: "Dia de fechamento deve estar entre 1 e 31.",
  },
  inactiveCard: {
    code: "CREDIT_CARDS_INACTIVE",
    status: HttpStatus.BAD_REQUEST,
    message: "Nao e possivel vincular uma divida a um cartao inativo.",
  },
  insufficientLimit: {
    code: "CREDIT_CARDS_INSUFFICIENT_LIMIT",
    status: HttpStatus.BAD_REQUEST,
    message: "Limite disponivel insuficiente no cartao selecionado.",
  },
} as const;
