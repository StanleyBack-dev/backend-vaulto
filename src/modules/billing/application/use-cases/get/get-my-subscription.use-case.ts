import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { SubscriptionView } from "@/modules/billing/application/ports/subscription-repository.port";
import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class GetMySubscriptionUseCase {
  constructor(
    private readonly createDefaultSubscriptionUseCase: CreateDefaultSubscriptionUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Backfills a FREE subscription on first read for users provisioned
  // before this module existed, instead of requiring a data migration.
  async execute(idUsers: string): Promise<SubscriptionView> {
    const subscription =
      await this.createDefaultSubscriptionUseCase.execute(idUsers);

    // ADMIN and ADMIN_MASTER are staff, not subscribers — PlanLimitsService
    // already lets them bypass every billing gate, so the subscription view
    // shown to them (and the frontend UI it drives) should read as Pro too,
    // instead of showing an unpaid Free badge for someone who was never
    // meant to pay.
    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (
      user?.group === UserGroup.ADMIN ||
      user?.group === UserGroup.ADMIN_MASTER
    ) {
      return {
        ...subscription,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      };
    }

    return subscription;
  }
}
