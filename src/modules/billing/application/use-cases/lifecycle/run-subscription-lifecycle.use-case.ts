import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  PAST_DUE_GRACE_PERIOD_DAYS,
  TRIAL_ENDING_REMINDER_WINDOW_HOURS,
} from "@/modules/billing/domain/constants/pro-plan.constant";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
  type SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { SubscriptionTrialEndingEmailUseCase } from "@/modules/mails/application/use-cases/subscription-trial-ending-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface RunSubscriptionLifecycleResult {
  trialRemindersSent: number;
  downgradedToFree: number;
}

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

@Injectable()
export class RunSubscriptionLifecycleUseCase {
  private readonly logger = new Logger(RunSubscriptionLifecycleUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    private readonly subscriptionTrialEndingEmailUseCase: SubscriptionTrialEndingEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<RunSubscriptionLifecycleResult> {
    const trialRemindersSent = await this.sendTrialEndingReminders();
    const downgradedToFree =
      (await this.downgradeStaleTrials()) +
      (await this.downgradePastDueSubscriptions()) +
      (await this.downgradeExpiredCancellations());

    this.logger.log(
      `Subscription lifecycle job: ${trialRemindersSent} lembrete(s) de trial enviado(s), ${downgradedToFree} assinatura(s) rebaixada(s) para FREE.`,
    );

    return { trialRemindersSent, downgradedToFree };
  }

  private async sendTrialEndingReminders(): Promise<number> {
    const trialingSubscriptions =
      await this.subscriptionRepository.findByStatus(
        SubscriptionStatus.TRIALING,
      );
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + TRIAL_ENDING_REMINDER_WINDOW_HOURS * HOUR_IN_MS,
    );

    let sent = 0;

    for (const subscription of trialingSubscriptions) {
      const { trialEndsAt } = subscription;
      if (!trialEndsAt || subscription.trialEndingNotifiedAt) {
        continue;
      }
      if (trialEndsAt <= now || trialEndsAt > windowEnd) {
        continue;
      }

      const user = await this.findUser(subscription);
      if (!user) {
        continue;
      }

      await this.subscriptionTrialEndingEmailUseCase.send({
        to: user.email,
        name: user.name,
        trialEndsAt,
      });
      await this.subscriptionRepository.updateByUserId(subscription.idUsers, {
        trialEndingNotifiedAt: now,
      });
      sent += 1;
    }

    return sent;
  }

  // Safety net for trials that never received a PAYMENT_CONFIRMED or
  // PAYMENT_OVERDUE webhook (e.g. a missed/failed Asaas delivery) — without
  // this, a subscription could stay TRIALING (and Pro) forever.
  private async downgradeStaleTrials(): Promise<number> {
    const trialingSubscriptions =
      await this.subscriptionRepository.findByStatus(
        SubscriptionStatus.TRIALING,
      );
    const staleBefore = new Date(
      Date.now() - PAST_DUE_GRACE_PERIOD_DAYS * DAY_IN_MS,
    );

    let downgraded = 0;

    for (const subscription of trialingSubscriptions) {
      if (!subscription.trialEndsAt || subscription.trialEndsAt > staleBefore) {
        continue;
      }

      await this.subscriptionRepository.updateByUserId(subscription.idUsers, {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.EXPIRED,
      });
      downgraded += 1;
    }

    return downgraded;
  }

  private async downgradePastDueSubscriptions(): Promise<number> {
    const pastDueSubscriptions = await this.subscriptionRepository.findByStatus(
      SubscriptionStatus.PAST_DUE,
    );
    const staleBefore = new Date(
      Date.now() - PAST_DUE_GRACE_PERIOD_DAYS * DAY_IN_MS,
    );

    let downgraded = 0;

    for (const subscription of pastDueSubscriptions) {
      if (
        !subscription.pastDueSince ||
        subscription.pastDueSince > staleBefore
      ) {
        continue;
      }

      await this.subscriptionRepository.updateByUserId(subscription.idUsers, {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.EXPIRED,
        pastDueSince: null,
      });
      downgraded += 1;
    }

    return downgraded;
  }

  // Covers cancelSubscription (CancelSubscriptionUseCase): the user keeps
  // Pro until the period they already paid for ends, then this rebuilds
  // them down to FREE without waiting for another Asaas webhook (Asaas was
  // already told to stop generating future charges at cancellation time).
  private async downgradeExpiredCancellations(): Promise<number> {
    const pendingCancellations =
      await this.subscriptionRepository.findPendingCancellations();
    const now = new Date();

    let downgraded = 0;

    for (const subscription of pendingCancellations) {
      const accessEndsAt =
        subscription.currentPeriodEnd ?? subscription.trialEndsAt;

      if (!accessEndsAt || accessEndsAt > now) {
        continue;
      }

      await this.subscriptionRepository.updateByUserId(subscription.idUsers, {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
      });
      downgraded += 1;
    }

    return downgraded;
  }

  private async findUser(subscription: SubscriptionView) {
    return this.userRepository.findOne({
      where: { idUsers: subscription.idUsers },
    });
  }
}
