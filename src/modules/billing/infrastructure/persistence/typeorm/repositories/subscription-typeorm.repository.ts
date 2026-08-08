import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  CreateSubscriptionPayload,
  SubscriptionRepositoryPort,
  SubscriptionView,
  UpdateSubscriptionPayload,
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

  async findByGatewaySubscriptionId(
    gatewaySubscriptionId: string,
  ): Promise<SubscriptionView | null> {
    const row = await this.repository.findOne({
      where: { gatewaySubscriptionId },
    });
    return row ? this.mapToView(row) : null;
  }

  async findByStatus(status: SubscriptionStatus): Promise<SubscriptionView[]> {
    const rows = await this.repository.find({ where: { status } });
    return rows.map((row) => this.mapToView(row));
  }

  async findPendingCancellations(): Promise<SubscriptionView[]> {
    const rows = await this.repository.find({
      where: { plan: SubscriptionPlan.PRO, cancelAtPeriodEnd: true },
    });
    return rows.map((row) => this.mapToView(row));
  }

  async updateByUserId(
    idUsers: string,
    payload: UpdateSubscriptionPayload,
  ): Promise<SubscriptionView> {
    const current = await this.repository.findOne({ where: { idUsers } });
    if (!current) {
      throw new Error("Subscription not found");
    }

    Object.assign(current, payload);

    const saved = await this.repository.save(current);
    return this.mapToView(saved);
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
      billingCycle: entity.billingCycle,
      trialEndingNotifiedAt: entity.trialEndingNotifiedAt,
      pastDueSince: entity.pastDueSince,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
