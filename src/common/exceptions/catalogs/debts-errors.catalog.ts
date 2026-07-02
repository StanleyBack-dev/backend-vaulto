import { HttpStatus } from "@nestjs/common";

export const debtsErrors = {
  notFound: {
    code: "DEBTS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Divida nao encontrada.",
  },
  accountRequired: {
    code: "DEBTS_ACCOUNT_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Conta de origem da divida e obrigatoria.",
  },
  invalidAmount: {
    code: "DEBTS_INVALID_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor da divida deve ser maior que zero.",
  },
  invalidInstallmentCount: {
    code: "DEBTS_INVALID_INSTALLMENT_COUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Quantidade de parcelas invalida para o tipo de divida informado.",
  },
  installmentsNotFound: {
    code: "DEBTS_INSTALLMENTS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Parcelas da divida nao encontradas.",
  },
  invalidPaymentAmount: {
    code: "DEBTS_INVALID_PAYMENT_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor de pagamento deve ser maior que zero.",
  },
  paymentExceedsOutstanding: {
    code: "DEBTS_PAYMENT_EXCEEDS_OUTSTANDING",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor de pagamento excede o saldo pendente da divida.",
  },
  invalidManualStatusTransition: {
    code: "DEBTS_INVALID_MANUAL_STATUS_TRANSITION",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Status PAID e PARTIALLY_PAID devem ser atualizados via registro de pagamento.",
  },
} as const;
