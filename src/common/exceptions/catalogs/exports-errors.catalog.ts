import { HttpStatus } from "@nestjs/common";

export const exportsErrors = {
  resourceNotMapped: {
    code: "EXPORT_RESOURCE_NOT_MAPPED",
    status: HttpStatus.BAD_REQUEST,
    message: "Recurso de exportação não mapeado.",
  },
  missingDebtFilter: {
    code: "EXPORT_MISSING_DEBT_FILTER",
    status: HttpStatus.BAD_REQUEST,
    message: "Selecione uma dívida para exportar os pagamentos.",
  },
  missingIncomeFilter: {
    code: "EXPORT_MISSING_INCOME_FILTER",
    status: HttpStatus.BAD_REQUEST,
    message: "Selecione uma receita para exportar os recebimentos.",
  },
  missingGoalFilter: {
    code: "EXPORT_MISSING_GOAL_FILTER",
    status: HttpStatus.BAD_REQUEST,
    message: "Selecione uma meta para exportar as contribuições.",
  },
  missingPeriodFilter: {
    code: "EXPORT_MISSING_PERIOD_FILTER",
    status: HttpStatus.BAD_REQUEST,
    message: "Informe o período (data inicial e final) para exportar o extrato.",
  },
};
