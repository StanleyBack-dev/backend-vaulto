import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { generateUniqueReferralCode } from "@/common/utils/referral-code.util";
import {
  REFERRAL_REWARD_REPOSITORY,
  type ReferralRewardRepositoryPort,
} from "@/modules/referrals/application/ports/referral-reward-repository.port";
import { REFERRAL_QUALIFIED_COUNT_THRESHOLD } from "@/modules/referrals/domain/constants/referral.constant";
import { ReferralRewardStatus } from "@/modules/referrals/domain/enums/referral-reward-status.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface ReferralStatsResult {
  referralCode: string;
  qualifiedReferralsCount: number;
  thresholdCount: number;
  rewardStatus: ReferralRewardStatus | null;
}

@Injectable()
export class GetMyReferralStatsUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(REFERRAL_REWARD_REPOSITORY)
    private readonly referralRewardRepository: ReferralRewardRepositoryPort,
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

    const reward = await this.referralRewardRepository.findByUser(idUsers);

    return {
      referralCode,
      qualifiedReferralsCount,
      thresholdCount: REFERRAL_QUALIFIED_COUNT_THRESHOLD,
      rewardStatus: reward?.status ?? null,
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
