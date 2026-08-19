import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  REFERRAL_WITHDRAWAL_REPOSITORY,
  type ReferralWithdrawalRepositoryPort,
} from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import { mapAsaasTransferStatus } from "@/modules/referrals/domain/mappers/map-asaas-transfer-status";

export interface SyncReferralWithdrawalTransferStatusCommand {
  gatewayTransferId: string;
  gatewayStatus: string;
  failReason?: string | null;
}

@Injectable()
export class SyncReferralWithdrawalTransferStatusUseCase {
  private readonly logger = new Logger(
    SyncReferralWithdrawalTransferStatusUseCase.name,
  );

  constructor(
    @Inject(REFERRAL_WITHDRAWAL_REPOSITORY)
    private readonly referralWithdrawalRepository: ReferralWithdrawalRepositoryPort,
  ) {}

  async execute(
    command: SyncReferralWithdrawalTransferStatusCommand,
  ): Promise<void> {
    const withdrawal =
      await this.referralWithdrawalRepository.findByGatewayTransferId(
        command.gatewayTransferId,
      );

    // Not every transfer on the account is a referral withdrawal payout —
    // ignore anything we didn't originate instead of erroring the webhook.
    if (!withdrawal) {
      return;
    }

    await this.referralWithdrawalRepository.update(
      withdrawal.idReferralWithdrawal,
      {
        status: mapAsaasTransferStatus(command.gatewayStatus),
        failReason: command.failReason,
        processedAt: new Date(),
      },
    );

    this.logger.log(
      `Saque de indicação ${withdrawal.idReferralWithdrawal} atualizado via webhook (transfer ${command.gatewayTransferId}): ${command.gatewayStatus}.`,
    );
  }
}
