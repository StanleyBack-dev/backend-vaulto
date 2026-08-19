import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  REFERRAL_CREDIT_REPOSITORY,
  type ReferralCreditRepositoryPort,
} from "@/modules/referrals/application/ports/referral-credit-repository.port";

export interface PromoteReferralCreditsResult {
  promoted: number;
}

// Runs daily (own Vercel Cron entry — see vercel.json), promoting any
// PENDING_HOLD credit whose hold period (REFERRAL_CREDIT_HOLD_DAYS) has
// elapsed to AVAILABLE, making it count toward the referrer's withdrawable
// balance. A credit refunded/charged back before this runs never reaches
// this point — HandleAsaasWebhookUseCase claws it back directly on the
// refund event.
@Injectable()
export class PromoteReferralCreditsUseCase {
  private readonly logger = new Logger(PromoteReferralCreditsUseCase.name);

  constructor(
    @Inject(REFERRAL_CREDIT_REPOSITORY)
    private readonly referralCreditRepository: ReferralCreditRepositoryPort,
  ) {}

  async execute(): Promise<PromoteReferralCreditsResult> {
    const dueCredits = await this.referralCreditRepository.findDueForPromotion(
      new Date(),
    );

    for (const credit of dueCredits) {
      await this.referralCreditRepository.markAvailable(
        credit.idReferralCredit,
      );
    }

    this.logger.log(
      `Referral credits job: ${dueCredits.length} crédito(s) promovido(s) para disponível.`,
    );

    return { promoted: dueCredits.length };
  }
}
