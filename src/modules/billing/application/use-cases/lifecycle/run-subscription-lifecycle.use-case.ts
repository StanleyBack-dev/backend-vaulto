import { Inject, Injectable, Logger } from "@nestjs/common";
import { PAST_DUE_GRACE_PERIOD_DAYS } from "@/modules/billing/domain/constants/pro-plan.constant";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

export interface RunSubscriptionLifecycleResult {
  downgradedToFree: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RunSubscriptionLifecycleUseCase {
  private readonly logger = new Logger(RunSubscriptionLifecycleUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  async execute(): Promise<RunSubscriptionLifecycleResult> {
    const downgradedToFree =
      (await this.downgradePastDueSubscriptions()) +
      (await this.downgradeExpiredCancellations());

    this.logger.log(
      `Subscription lifecycle job: ${downgradedToFree} assinatura(s) rebaixada(s) para FREE.`,
    );

    return { downgradedToFree };
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
      const accessEndsAt = subscription.currentPeriodEnd;

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
}
