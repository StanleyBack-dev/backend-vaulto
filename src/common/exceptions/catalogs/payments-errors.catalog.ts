import { HttpStatus } from "@nestjs/common";

export const paymentsErrors = {
  invalidAmount: {
    code: "PAYMENTS_INVALID_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor de pagamento deve ser maior que zero.",
  },
  installmentNotFound: {
    code: "PAYMENTS_INSTALLMENT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Parcela nao encontrada para a divida informada.",
  },
  installmentAlreadyPaid: {
    code: "PAYMENTS_INSTALLMENT_ALREADY_PAID",
    status: HttpStatus.BAD_REQUEST,
    message: "Parcela ja esta totalmente paga.",
  },
  amountExceedsOutstanding: {
    code: "PAYMENTS_AMOUNT_EXCEEDS_OUTSTANDING",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Valor de pagamento excede o saldo pendente a partir da parcela selecionada.",
  },
  paymentNotFound: {
    code: "PAYMENTS_PAYMENT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Pagamento nao encontrado.",
  },
} as const;
