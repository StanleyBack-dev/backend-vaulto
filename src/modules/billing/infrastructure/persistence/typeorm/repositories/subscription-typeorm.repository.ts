import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  CreateSubscriptionPayload,
  SubscriptionRepositoryPort,
  SubscriptionView,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";

@Injectable()
export class SubscriptionTypeormRepository implements SubscriptionRepositoryPort {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  async create(payload: CreateSubscriptionPayload): Promise<SubscriptionView> {
    const created = this.repository.create({
      idUsers: payload.idUsers,
      plan: payload.plan ?? SubscriptionPlan.FREE,
      status: payload.status ?? SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
    });

    const saved = await this.repository.save(created);
    return this.mapToView(saved);
  }

  async findByUserId(idUsers: string): Promise<SubscriptionView | null> {
    const row = await this.repository.findOne({ where: { idUsers } });
    return row ? this.mapToView(row) : null;
  }

  private mapToView(entity: SubscriptionEntity): SubscriptionView {
    return {
      idSubscription: entity.idSubscription,
      idUsers: entity.idUsers,
      plan: entity.plan,
      status: entity.status,
      trialEndsAt: entity.trialEndsAt,
      currentPeriodEnd: entity.currentPeriodEnd,
      cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
      gatewayCustomerId: entity.gatewayCustomerId,
      gatewaySubscriptionId: entity.gatewaySubscriptionId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
