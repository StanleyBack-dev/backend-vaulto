import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { FREE_PLAN_LIMITS } from "@/modules/billing/domain/constants/free-plan-limits.constant";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

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
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // ADMIN and ADMIN_MASTER run the system and must never be blocked by a
  // plan limit or a Pro gate — they're staff, not subscribers. The ADMIN
  // menu itself stays restricted to ADMIN_MASTER via GROUP_DEFAULT_PAGE_ACCESS,
  // this only bypasses billing.
  private async isStaff(idUsers: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { idUsers } });
    return (
      user?.group === UserGroup.ADMIN || user?.group === UserGroup.ADMIN_MASTER
    );
  }

  // `currentCount` is supplied by the calling module (e.g. DebtsModule
  // counts its own debts via debtRepository.listByUser) so billing never
  // depends on the debts/credit-cards/incomes repositories, which would
  // create a module import cycle.
  async assertCanCreate(
    idUsers: string,
    resource: PlanLimitedResource,
    currentCount: number,
  ): Promise<void> {
    if (await this.isStaff(idUsers)) {
      return;
    }

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
    if (await this.isStaff(idUsers)) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByUserId(idUsers);
    const plan = subscription?.plan ?? SubscriptionPlan.FREE;

    if (plan !== SubscriptionPlan.PRO) {
      throw AppException.from(APP_ERRORS.billing.proPlanRequired, undefined);
    }
  }
}
