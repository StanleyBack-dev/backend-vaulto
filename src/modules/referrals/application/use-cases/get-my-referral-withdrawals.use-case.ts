import { Inject, Injectable } from "@nestjs/common";
import {
  REFERRAL_WITHDRAWAL_REPOSITORY,
  type ReferralWithdrawalRepositoryPort,
  type ReferralWithdrawalView,
} from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";

@Injectable()
export class GetMyReferralWithdrawalsUseCase {
  constructor(
    @Inject(REFERRAL_WITHDRAWAL_REPOSITORY)
    private readonly referralWithdrawalRepository: ReferralWithdrawalRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<ReferralWithdrawalView[]> {
    return this.referralWithdrawalRepository.findByUser(idUsers);
  }
}
