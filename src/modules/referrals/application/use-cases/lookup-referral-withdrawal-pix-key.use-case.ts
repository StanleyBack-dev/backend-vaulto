import { Inject, Injectable, Logger } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  PAYMENT_GATEWAY,
  type PaymentGatewayPort,
} from "@/modules/billing/application/ports/payment-gateway.port";
import type { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";

export interface LookupReferralWithdrawalPixKeyCommand {
  pixKey: string;
  pixKeyType: PixKeyType;
}

export interface PixKeyLookupResult {
  bankName: string;
  ownerName: string;
  ownerDocument: string;
}

@Injectable()
export class LookupReferralWithdrawalPixKeyUseCase {
  private readonly logger = new Logger(
    LookupReferralWithdrawalPixKeyUseCase.name,
  );

  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(
    idUsers: string,
    command: LookupReferralWithdrawalPixKeyCommand,
  ): Promise<PixKeyLookupResult> {
    try {
      return await this.paymentGateway.lookupPixKey({
        pixKeyType: command.pixKeyType,
        pixKey: command.pixKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.warn(
        `Falha ao consultar chave Pix (usuário ${idUsers}, tipo ${command.pixKeyType}): ${message}`,
      );

      throw AppException.from(
        APP_ERRORS.referrals.pixKeyLookupFailed,
        undefined,
      );
    }
  }
}
