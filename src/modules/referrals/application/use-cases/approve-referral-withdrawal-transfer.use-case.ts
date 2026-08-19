import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { verifyWebhookToken } from "@/common/utils/verify-webhook-token.util";
import {
  REFERRAL_WITHDRAWAL_REPOSITORY,
  type ReferralWithdrawalRepositoryPort,
} from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";

export interface ApproveReferralWithdrawalTransferResult {
  approved: boolean;
  refuseReason?: string;
}

// Backs Asaas' "critical event" transfer confirmation: instead of a human
// clicking "send code" on every Pix payout, Asaas asks this webhook whether
// a given outbound transfer should proceed. We approve only transfers we
// ourselves created for a referral withdrawal (matched by gatewayTransferId)
// — anything else on the account still needs a human to look at it.
@Injectable()
export class ApproveReferralWithdrawalTransferUseCase {
  private readonly logger = new Logger(
    ApproveReferralWithdrawalTransferUseCase.name,
  );

  constructor(
    private readonly configService: ConfigService,
    @Inject(REFERRAL_WITHDRAWAL_REPOSITORY)
    private readonly referralWithdrawalRepository: ReferralWithdrawalRepositoryPort,
  ) {}

  async execute(
    receivedToken: string | undefined,
    gatewayTransferId: string,
  ): Promise<ApproveReferralWithdrawalTransferResult> {
    const expectedToken = this.configService.get<string>("ASAAS_WEBHOOK_TOKEN");

    if (!verifyWebhookToken(receivedToken, expectedToken)) {
      throw AppException.from(
        APP_ERRORS.billing.invalidWebhookToken,
        undefined,
      );
    }

    const withdrawal =
      await this.referralWithdrawalRepository.findByGatewayTransferId(
        gatewayTransferId,
      );

    if (!withdrawal) {
      this.logger.warn(
        `Transferência ${gatewayTransferId} não corresponde a nenhum saque de indicação conhecido — recusando aprovação automática.`,
      );

      return {
        approved: false,
        refuseReason: "Transferência não reconhecida pelo Vaulto.",
      };
    }

    return { approved: true };
  }
}
