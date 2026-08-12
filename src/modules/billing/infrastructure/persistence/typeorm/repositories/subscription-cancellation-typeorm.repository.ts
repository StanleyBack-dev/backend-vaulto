import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  CreateSubscriptionCancellationPayload,
  SubscriptionCancellationRepositoryPort,
} from "@/modules/billing/application/ports/subscription-cancellation-repository.port";
import { SubscriptionCancellationEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription-cancellation.entity";

@Injectable()
export class SubscriptionCancellationTypeormRepository implements SubscriptionCancellationRepositoryPort {
  constructor(
    @InjectRepository(SubscriptionCancellationEntity)
    private readonly repository: Repository<SubscriptionCancellationEntity>,
  ) {}

  async create(payload: CreateSubscriptionCancellationPayload): Promise<void> {
    const created = this.repository.create(payload);
    await this.repository.save(created);
  }
}
