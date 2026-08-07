import { Inject, Injectable } from "@nestjs/common";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
  type SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";

@Injectable()
export class CreateDefaultSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<SubscriptionView> {
    const existing = await this.subscriptionRepository.findByUserId(idUsers);
    if (existing) {
      return existing;
    }

    return this.subscriptionRepository.create({
      idUsers,
      plan: SubscriptionPlan.FREE,
    });
  }
}
