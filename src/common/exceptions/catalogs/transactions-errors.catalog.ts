import { HttpStatus } from "@nestjs/common";

export const transactionsErrors = {
  invalidAmount: {
    code: "TRANSACTIONS_INVALID_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor da transacao deve ser maior que zero.",
  },
} as const;
