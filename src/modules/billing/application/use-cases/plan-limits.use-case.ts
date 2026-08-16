import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { FREE_PLAN_LIMITS } from "@/modules/billing/domain/constants/free-plan-limits.constant";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";

const RESOURCE_LABELS: Record<PlanLimitedResource, string> = {
  [PlanLimitedResource.DEBTS]: "dividas",
  [PlanLimitedResource.CREDIT_CARDS]: "cartoes de credito",
  [PlanLimitedResource.INCOMES]: "receitas",
};

@Injectable()
export class PlanLimitsService {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  // `currentCount` is supplied by the calling module (e.g. DebtsModule
  // counts its own debts via debtRepository.listByUser) so billing never
  // depends on the debts/credit-cards/incomes repositories, which would
  // create a module import cycle.
  async assertCanCreate(
    idUsers: string,
    resource: PlanLimitedResource,
    currentCount: number,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findByUserId(idUsers);
    const plan = subscription?.plan ?? SubscriptionPlan.FREE;

    if (plan === SubscriptionPlan.PRO) {
      return;
    }

    const limit = FREE_PLAN_LIMITS[resource];
    if (currentCount >= limit) {
      throw AppException.from(APP_ERRORS.billing.planLimitReached, {
        resource: RESOURCE_LABELS[resource],
        limit,
      });
    }
  }

  // Gates a whole feature (not a per-resource count) behind the Pro plan,
  // e.g. the financial forecast.
  async assertProPlan(idUsers: string): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findByUserId(idUsers);
    const plan = subscription?.plan ?? SubscriptionPlan.FREE;

    if (plan !== SubscriptionPlan.PRO) {
      throw AppException.from(APP_ERRORS.billing.proPlanRequired, undefined);
    }
  }
}
