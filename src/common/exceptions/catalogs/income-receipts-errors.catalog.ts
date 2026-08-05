import { HttpStatus } from "@nestjs/common";

export const incomeReceiptsErrors = {
  invalidAmount: {
    code: "INCOME_RECEIPTS_INVALID_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor de recebimento deve ser maior que zero.",
  },
  installmentNotFound: {
    code: "INCOME_RECEIPTS_INSTALLMENT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Parcela não encontrada para a receita informada.",
  },
  installmentAlreadyReceived: {
    code: "INCOME_RECEIPTS_INSTALLMENT_ALREADY_RECEIVED",
    status: HttpStatus.BAD_REQUEST,
    message: "Parcela já está totalmente recebida.",
  },
  amountExceedsOutstanding: {
    code: "INCOME_RECEIPTS_AMOUNT_EXCEEDS_OUTSTANDING",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Valor de recebimento excede o saldo pendente a partir da parcela selecionada.",
  },
  receiptNotFound: {
    code: "INCOME_RECEIPTS_RECEIPT_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Recebimento não encontrado.",
  },
} as const;
