import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { generateUniqueReferralCode } from "@/common/utils/referral-code.util";
import {
  REFERRAL_CREDIT_REPOSITORY,
  type ReferralCreditRepositoryPort,
} from "@/modules/referrals/application/ports/referral-credit-repository.port";
import {
  REFERRAL_WITHDRAWAL_REPOSITORY,
  type ReferralWithdrawalRepositoryPort,
} from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import {
  REFERRAL_CREDIT_AMOUNT_CENTS,
  REFERRAL_CREDIT_HOLD_DAYS,
  REFERRAL_MIN_WITHDRAWAL_CENTS,
} from "@/modules/referrals/domain/constants/referral.constant";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface ReferralStatsResult {
  referralCode: string;
  qualifiedReferralsCount: number;
  creditAmountCents: number;
  minWithdrawalCents: number;
  creditHoldDays: number;
  availableBalanceCents: number;
  pendingHoldBalanceCents: number;
}

@Injectable()
export class GetMyReferralStatsUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(REFERRAL_CREDIT_REPOSITORY)
    private readonly referralCreditRepository: ReferralCreditRepositoryPort,
    @Inject(REFERRAL_WITHDRAWAL_REPOSITORY)
    private readonly referralWithdrawalRepository: ReferralWithdrawalRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<ReferralStatsResult> {
    const user = await this.userRepository.findOneOrFail({
      where: { idUsers },
    });

    const referralCode =
      user.referralCode ?? (await this.assignReferralCode(idUsers));

    const qualifiedReferralsCount = await this.userRepository.count({
      where: { referredByUserId: idUsers, referralQualifiedAt: Not(IsNull()) },
    });

    const [availableCredits, pendingHoldBalanceCents, reservedForWithdrawal] =
      await Promise.all([
        this.referralCreditRepository.sumAvailableForUser(idUsers),
        this.referralCreditRepository.sumPendingHoldForUser(idUsers),
        this.referralWithdrawalRepository.sumActiveForUser(idUsers),
      ]);

    return {
      referralCode,
      qualifiedReferralsCount,
      creditAmountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
      minWithdrawalCents: REFERRAL_MIN_WITHDRAWAL_CENTS,
      creditHoldDays: REFERRAL_CREDIT_HOLD_DAYS,
      availableBalanceCents: Math.max(
        availableCredits - reservedForWithdrawal,
        0,
      ),
      pendingHoldBalanceCents,
    };
  }

  private async assignReferralCode(idUsers: string): Promise<string> {
    const code = await generateUniqueReferralCode((candidate) =>
      this.userRepository
        .count({ where: { referralCode: candidate } })
        .then((count) => count > 0),
    );

    await this.userRepository.update({ idUsers }, { referralCode: code });

    return code;
  }
}
