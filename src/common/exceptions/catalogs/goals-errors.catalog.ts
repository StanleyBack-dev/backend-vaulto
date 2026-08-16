import { HttpStatus } from "@nestjs/common";

export const goalsErrors = {
  notFound: {
    code: "GOALS_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Meta não encontrada.",
  },
  invalidTargetAmount: {
    code: "GOALS_INVALID_TARGET_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor-alvo da meta deve ser maior que zero.",
  },
  targetDateInPast: {
    code: "GOALS_TARGET_DATE_IN_PAST",
    status: HttpStatus.BAD_REQUEST,
    message: "Prazo da meta não pode ser no passado.",
  },
  invalidContributionAmount: {
    code: "GOALS_INVALID_CONTRIBUTION_AMOUNT",
    status: HttpStatus.BAD_REQUEST,
    message: "Valor da contribuição deve ser maior que zero.",
  },
  contributionNotFound: {
    code: "GOALS_CONTRIBUTION_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Contribuição não encontrada.",
  },
} as const;
