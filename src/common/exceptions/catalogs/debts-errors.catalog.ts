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
  dueDateRequiredForInstallments: {
    code: "DEBTS_DUE_DATE_REQUIRED_FOR_INSTALLMENTS",
    status: HttpStatus.BAD_REQUEST,
    message: "Informe a data de vencimento da primeira parcela.",
  },
  dueDateNotEditableForInstallments: {
    code: "DEBTS_DUE_DATE_NOT_EDITABLE_FOR_INSTALLMENTS",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Nao e possivel alterar o vencimento de uma divida parcelada por aqui.",
  },
  dueDateNotEditableForCreditCard: {
    code: "DEBTS_DUE_DATE_NOT_EDITABLE_FOR_CREDIT_CARD",
    status: HttpStatus.BAD_REQUEST,
    message:
      "O vencimento e calculado automaticamente pelo cartao de credito vinculado e nao pode ser alterado por aqui.",
  },
  totalAmountNotEditableForInstallments: {
    code: "DEBTS_TOTAL_AMOUNT_NOT_EDITABLE_FOR_INSTALLMENTS",
    status: HttpStatus.BAD_REQUEST,
    message: "Nao e possivel alterar o valor de uma divida parcelada por aqui.",
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
