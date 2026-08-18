import { Inject, Injectable, Logger } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  PAYMENT_GATEWAY,
  type PaymentGatewayPort,
} from "@/modules/billing/application/ports/payment-gateway.port";
import {
  REFERRAL_CREDIT_REPOSITORY,
  type ReferralCreditRepositoryPort,
} from "@/modules/referrals/application/ports/referral-credit-repository.port";
import {
  REFERRAL_WITHDRAWAL_REPOSITORY,
  type ReferralWithdrawalRepositoryPort,
  type ReferralWithdrawalView,
} from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import { REFERRAL_MIN_WITHDRAWAL_CENTS } from "@/modules/referrals/domain/constants/referral.constant";
import type { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

export interface RequestReferralWithdrawalCommand {
  pixKey: string;
  pixKeyType: PixKeyType;
}

// Withdraws the referrer's entire current available balance — no partial
// withdrawals — matching the "sacar como app de aposta" UX: the user hits
// one button once they've crossed the minimum, not a form where they pick
// an amount.
//
// The Asaas transfer is called synchronously, in the same request: no
// manual approval step, by design (see REFERRAL_CASH_REWARDS_PROJECT.md).
// A transfer failure marks the withdrawal FAILED rather than leaving it
// stuck REQUESTED, and does not consume the referrer's balance (the sum
// only counts REQUESTED/PROCESSING/COMPLETED withdrawals as reserved).
@Injectable()
export class RequestReferralWithdrawalUseCase {
  private readonly logger = new Logger(RequestReferralWithdrawalUseCase.name);

  constructor(
    @Inject(REFERRAL_CREDIT_REPOSITORY)
    private readonly referralCreditRepository: ReferralCreditRepositoryPort,
    @Inject(REFERRAL_WITHDRAWAL_REPOSITORY)
    private readonly referralWithdrawalRepository: ReferralWithdrawalRepositoryPort,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(
    idUsers: string,
    command: RequestReferralWithdrawalCommand,
  ): Promise<ReferralWithdrawalView> {
    const availableBalanceCents = await this.getAvailableBalanceCents(idUsers);

    if (availableBalanceCents < REFERRAL_MIN_WITHDRAWAL_CENTS) {
      throw AppException.from(
        APP_ERRORS.referrals.withdrawalBelowMinimum,
        undefined,
      );
    }

    const withdrawal = await this.referralWithdrawalRepository.create({
      idUsers,
      amountCents: availableBalanceCents,
      pixKey: command.pixKey,
      pixKeyType: command.pixKeyType,
      requestedAt: new Date(),
    });

    return this.processTransfer(withdrawal);
  }

  private async getAvailableBalanceCents(idUsers: string): Promise<number> {
    const [availableCredits, reserved] = await Promise.all([
      this.referralCreditRepository.sumAvailableForUser(idUsers),
      this.referralWithdrawalRepository.sumActiveForUser(idUsers),
    ]);

    return Math.max(availableCredits - reserved, 0);
  }

  private async processTransfer(
    withdrawal: ReferralWithdrawalView,
  ): Promise<ReferralWithdrawalView> {
    try {
      const transfer = await this.paymentGateway.createPixTransfer({
        value: withdrawal.amountCents / 100,
        pixAddressKey: withdrawal.pixKey,
        pixAddressKeyType: withdrawal.pixKeyType,
        description: "Saque de indicações Vaulto",
        externalReference: withdrawal.idReferralWithdrawal,
      });

      return this.referralWithdrawalRepository.update(
        withdrawal.idReferralWithdrawal,
        {
          status: this.mapGatewayStatus(transfer.status),
          gatewayTransferId: transfer.gatewayTransferId,
          failReason: transfer.failReason,
          processedAt: new Date(),
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha ao processar saque de indicação ${withdrawal.idReferralWithdrawal}: ${message}`,
      );

      await this.referralWithdrawalRepository.update(
        withdrawal.idReferralWithdrawal,
        {
          status: ReferralWithdrawalStatus.FAILED,
          failReason: message,
          processedAt: new Date(),
        },
      );

      throw AppException.from(
        APP_ERRORS.referrals.withdrawalTransferFailed,
        undefined,
      );
    }
  }

  // Asaas' PENDING/BANK_PROCESSING both mean "accepted, in flight" for a
  // Pix transfer (which otherwise settles near-instantly) — treated as
  // PROCESSING here rather than a distinct status, since the withdrawal
  // history doesn't need to distinguish them.
  private mapGatewayStatus(gatewayStatus: string): ReferralWithdrawalStatus {
    if (gatewayStatus === "DONE") {
      return ReferralWithdrawalStatus.COMPLETED;
    }

    if (gatewayStatus === "CANCELLED" || gatewayStatus === "FAILED") {
      return ReferralWithdrawalStatus.FAILED;
    }

    return ReferralWithdrawalStatus.PROCESSING;
  }
}
