import { HttpStatus } from "@nestjs/common";

export const incomesErrors = {
  notFound: {
    code: "INCOMES_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Receita não encontrada.",
  },
  invalidAmount: {
    code: "INCOMES_INVALID_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor da receita deve ser maior que zero.",
  },
  invalidInstallmentCount: {
    code: "INCOMES_INVALID_INSTALLMENT_COUNT",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Quantidade de parcelas inválida para o tipo de receita informado.",
  },
  dueDateRequiredForInstallments: {
    code: "INCOMES_DUE_DATE_REQUIRED_FOR_INSTALLMENTS",
    status: HttpStatus.BAD_REQUEST,
    message: "Informe a data de vencimento da primeira parcela.",
  },
  dueDateNotEditableForInstallments: {
    code: "INCOMES_DUE_DATE_NOT_EDITABLE_FOR_INSTALLMENTS",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Não é possível alterar o vencimento de uma receita parcelada por aqui.",
  },
  totalAmountNotEditableForInstallments: {
    code: "INCOMES_TOTAL_AMOUNT_NOT_EDITABLE_FOR_INSTALLMENTS",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Não é possível alterar o valor de uma receita parcelada por aqui.",
  },
  installmentsNotFound: {
    code: "INCOMES_INSTALLMENTS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Parcelas da receita não encontradas.",
  },
  categoryNotFound: {
    code: "INCOMES_CATEGORY_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Categoria não encontrada.",
  },
  categoryNotIncomeType: {
    code: "INCOMES_CATEGORY_NOT_INCOME_TYPE",
    status: HttpStatus.BAD_REQUEST,
    message: "A categoria selecionada não é do tipo receita.",
  },
  invalidManualStatusTransition: {
    code: "INCOMES_INVALID_MANUAL_STATUS_TRANSITION",
    status: HttpStatus.BAD_REQUEST,
    message:
      "Status RECEIVED e PARTIALLY_RECEIVED devem ser atualizados via registro de recebimento.",
  },
} as const;
