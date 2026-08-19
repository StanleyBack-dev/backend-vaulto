import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  REFERRAL_CREDIT_REPOSITORY,
  type ReferralCreditRepositoryPort,
} from "@/modules/referrals/application/ports/referral-credit-repository.port";

// Called from HandleAsaasWebhookUseCase when a PAYMENT_DELETED or
// PAYMENT_REFUNDED event lands for a referred user's payment — the same
// event that downgrades that user back to Free. If the referral credit it
// funded is still PENDING_HOLD (hasn't been promoted to AVAILABLE yet), it
// gets clawed back instead of ever becoming withdrawable.
//
// A refund/chargeback arriving AFTER the credit is already AVAILABLE (or
// withdrawn) — a Pix MED or card chargeback well past the 7-day hold, much
// rarer than the CDC withdrawal-right window the hold is sized for — is
// deliberately left alone here; that residual case is small enough to
// handle manually rather than build automatic negative-balance recovery.
@Injectable()
export class ClawbackReferralCreditUseCase {
  private readonly logger = new Logger(ClawbackReferralCreditUseCase.name);

  constructor(
    @Inject(REFERRAL_CREDIT_REPOSITORY)
    private readonly referralCreditRepository: ReferralCreditRepositoryPort,
  ) {}

  async execute(idReferredUser: string): Promise<void> {
    const credit =
      await this.referralCreditRepository.findPendingByReferredUser(
        idReferredUser,
      );

    if (!credit) {
      return;
    }

    await this.referralCreditRepository.markClawedBack(
      credit.idReferralCredit,
      new Date(),
    );

    this.logger.log(
      `Crédito de indicação ${credit.idReferralCredit} estornado (pagamento do indicado ${idReferredUser} foi revertido).`,
    );
  }
}
