import { HttpStatus } from "@nestjs/common";

export const accountLifecycleErrors = {
  deactivationReasonRequired: {
    code: "ACCOUNT_LIFECYCLE_DEACTIVATION_REASON_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Selecione ao menos um motivo para inativar a conta.",
  },
  accountAlreadyInactive: {
    code: "ACCOUNT_LIFECYCLE_ACCOUNT_ALREADY_INACTIVE",
    status: HttpStatus.CONFLICT,
    message: "Esta conta já está inativa.",
  },
  deletionReasonRequired: {
    code: "ACCOUNT_LIFECYCLE_DELETION_REASON_REQUIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Selecione ao menos um motivo para excluir a conta.",
  },
  deletionAlreadyRequested: {
    code: "ACCOUNT_LIFECYCLE_DELETION_ALREADY_REQUESTED",
    status: HttpStatus.CONFLICT,
    message: "Já existe uma solicitação de exclusão em andamento.",
  },
  noDeletionRequestToCancel: {
    code: "ACCOUNT_LIFECYCLE_NO_DELETION_REQUEST_TO_CANCEL",
    status: HttpStatus.CONFLICT,
    message: "Não há solicitação de exclusão de conta para cancelar.",
  },
} as const;
