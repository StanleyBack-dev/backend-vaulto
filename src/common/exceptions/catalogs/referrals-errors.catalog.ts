import { HttpStatus } from "@nestjs/common";

export const referralsErrors = {
  withdrawalBelowMinimum: {
    code: "REFERRALS_WITHDRAWAL_BELOW_MINIMUM",
    status: HttpStatus.CONFLICT,
    message: "Saldo disponível abaixo do valor mínimo para saque.",
  },
  withdrawalTransferFailed: {
    code: "REFERRALS_WITHDRAWAL_TRANSFER_FAILED",
    status: HttpStatus.BAD_GATEWAY,
    message:
      "Não foi possível concluir a transferência do saque. Tente novamente em instantes.",
  },
  pixKeyLookupFailed: {
    code: "REFERRALS_PIX_KEY_LOOKUP_FAILED",
    status: HttpStatus.BAD_GATEWAY,
    message:
      "Não foi possível verificar essa chave Pix agora. Confira os dados com atenção antes de continuar.",
  },
};
