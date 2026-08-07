import { Injectable } from "@nestjs/common";
import type { SubscriptionView } from "@/modules/billing/application/ports/subscription-repository.port";
import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";

@Injectable()
export class GetMySubscriptionUseCase {
  constructor(
    private readonly createDefaultSubscriptionUseCase: CreateDefaultSubscriptionUseCase,
  ) {}

  // Backfills a FREE subscription on first read for users provisioned
  // before this module existed, instead of requiring a data migration.
  async execute(idUsers: string): Promise<SubscriptionView> {
    return this.createDefaultSubscriptionUseCase.execute(idUsers);
  }
}
