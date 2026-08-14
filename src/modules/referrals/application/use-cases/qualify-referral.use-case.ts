import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import {
  REFERRAL_QUALIFIED_COUNT_THRESHOLD,
  REFERRAL_REWARD_DAYS,
} from "@/modules/referrals/domain/constants/referral.constant";
import {
  REFERRAL_REWARD_REPOSITORY,
  type ReferralRewardRepositoryPort,
} from "@/modules/referrals/application/ports/referral-reward-repository.port";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { ReferralRewardGrantedEmailUseCase } from "@/modules/mails/application/use-cases/referral-reward-granted-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Called from HandleAsaasWebhookUseCase the moment a subscription is
// confirmed paid for the first time (not at trial start — a friend can
// cancel a trial before ever being charged, which shouldn't count). Also
// registered directly in BillingModule (in addition to ReferralsModule) so
// the webhook handler can inject it without BillingModule importing
// ReferralsModule — see comment on ReferralRewardEntity registration in
// billing.module.ts.
@Injectable()
export class QualifyReferralUseCase {
  private readonly logger = new Logger(QualifyReferralUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(REFERRAL_REWARD_REPOSITORY)
    private readonly referralRewardRepository: ReferralRewardRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    private readonly referralRewardGrantedEmailUseCase: ReferralRewardGrantedEmailUseCase,
  ) {}

  async execute(idUsers: string): Promise<void> {
    const referredUser = await this.userRepository.findOne({
      where: { idUsers },
    });

    if (!referredUser?.referredByUserId || referredUser.referralQualifiedAt) {
      return;
    }

    const qualifiedAt = new Date();
    await this.userRepository.update(
      { idUsers },
      { referralQualifiedAt: qualifiedAt },
    );

    await this.maybeGrantReward(referredUser.referredByUserId);
  }

  private async maybeGrantReward(referrerId: string): Promise<void> {
    const qualifiedCount = await this.userRepository.count({
      where: {
        referredByUserId: referrerId,
        referralQualifiedAt: Not(IsNull()),
      },
    });

    if (qualifiedCount < REFERRAL_QUALIFIED_COUNT_THRESHOLD) {
      return;
    }

    const alreadyRewarded =
      await this.referralRewardRepository.existsForUser(referrerId);
    if (alreadyRewarded) {
      return;
    }

    const grantedAt = new Date();
    await this.referralRewardRepository.create(referrerId, grantedAt);

    const appliedImmediately = await this.applyIfFreePlan(referrerId);

    await this.notifyReferrer(referrerId, appliedImmediately);
  }

  // A Free-plan referrer has nothing to conflict with — grant the reward
  // straight away. A Pro (trialing or paying) referrer keeps their reward
  // PENDING: it gets consumed by ApplyReferralRewardsUseCase right when they
  // would otherwise lapse back to Free, so it never has to fight with an
  // Asaas billing cycle that's already in flight.
  private async applyIfFreePlan(idUsers: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findByUserId(idUsers);

    if (!subscription || subscription.plan !== SubscriptionPlan.FREE) {
      return false;
    }

    await this.subscriptionRepository.updateByUserId(idUsers, {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + REFERRAL_REWARD_DAYS * DAY_IN_MS),
    });

    const ownReward = await this.referralRewardRepository.findByUser(idUsers);
    if (ownReward) {
      await this.referralRewardRepository.markApplied(
        ownReward.idReferralReward,
        new Date(),
      );
    }

    return true;
  }

  private async notifyReferrer(
    idUsers: string,
    appliedImmediately: boolean,
  ): Promise<void> {
    const referrer = await this.userRepository.findOne({
      where: { idUsers },
    });
    if (!referrer) {
      return;
    }

    try {
      await this.referralRewardGrantedEmailUseCase.send({
        to: referrer.email,
        name: referrer.name,
        appliedImmediately,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha no envio de email de recompensa de indicação para ${referrer.email}: ${message}`,
      );
    }
  }
}
