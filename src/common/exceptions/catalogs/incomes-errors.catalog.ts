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
