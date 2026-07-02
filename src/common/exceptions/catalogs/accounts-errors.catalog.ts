import { HttpStatus } from "@nestjs/common";

export const accountsErrors = {
  notFound: {
    code: "ACCOUNTS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Conta nao encontrada.",
  },
  transferSameAccountNotAllowed: {
    code: "ACCOUNTS_TRANSFER_SAME_ACCOUNT_NOT_ALLOWED",
    status: HttpStatus.BAD_REQUEST,
    message: "Conta de origem e destino devem ser diferentes.",
  },
  invalidTransferAmount: {
    code: "ACCOUNTS_INVALID_TRANSFER_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor da transferencia deve ser maior que zero.",
  },
  insufficientBalance: {
    code: "ACCOUNTS_INSUFFICIENT_BALANCE",
    status: HttpStatus.BAD_REQUEST,
    message: "Saldo insuficiente na conta de origem.",
  },
  invalidInitialBalance: {
    code: "ACCOUNTS_INVALID_INITIAL_BALANCE",
    status: HttpStatus.BAD_REQUEST,
    message: "Saldo inicial da conta e invalido.",
  },
} as const;
