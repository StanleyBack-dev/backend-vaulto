import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  REFERRAL_REWARD_REPOSITORY,
  type ReferralRewardRepositoryPort,
} from "@/modules/referrals/application/ports/referral-reward-repository.port";
import { REFERRAL_REWARD_DAYS } from "@/modules/referrals/domain/constants/referral.constant";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface ApplyReferralRewardsResult {
  applied: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Runs daily (its own Vercel Cron entry, scheduled ahead of the billing
// subscription-lifecycle job — see vercel.json) and rescues any Pro referrer
// with a PENDING reward who is right at the point RunSubscriptionLifecycleUseCase
// would otherwise downgrade them to Free: a stale/unconverted trial, or a
// payment gone past due. Runs first on purpose, so that by the time the
// billing job checks, the rescued subscription no longer matches its
// downgrade criteria — this is how the two stay decoupled (billing has no
// idea referrals exist).
//
// Deliberately does NOT rescue a subscription pending cancellation
// (CancelSubscriptionUseCase): the user asked to leave, so an involuntary
// lapse (trial/payment) is the only case a surprise extra month applies to.
@Injectable()
export class ApplyReferralRewardsUseCase {
  private readonly logger = new Logger(ApplyReferralRewardsUseCase.name);

  constructor(
    @Inject(REFERRAL_REWARD_REPOSITORY)
    private readonly referralRewardRepository: ReferralRewardRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<ApplyReferralRewardsResult> {
    const pendingRewards = await this.referralRewardRepository.findPending();
    const now = new Date();

    let applied = 0;

    for (const reward of pendingRewards) {
      const subscription = await this.subscriptionRepository.findByUserId(
        reward.idUsers,
      );
      if (!subscription) {
        continue;
      }

      const isLapsingTrial =
        subscription.status === SubscriptionStatus.TRIALING &&
        !!subscription.trialEndsAt &&
        subscription.trialEndsAt <= now;
      const isPastDue = subscription.status === SubscriptionStatus.PAST_DUE;

      if (!isLapsingTrial && !isPastDue) {
        continue;
      }

      await this.subscriptionRepository.updateByUserId(reward.idUsers, {
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        pastDueSince: null,
        currentPeriodEnd: new Date(
          now.getTime() + REFERRAL_REWARD_DAYS * DAY_IN_MS,
        ),
      });

      await this.referralRewardRepository.markApplied(
        reward.idReferralReward,
        now,
      );
      applied += 1;
    }

    this.logger.log(
      `Referral rewards job: ${applied} recompensa(s) de indicação aplicada(s).`,
    );

    return { applied };
  }
}
