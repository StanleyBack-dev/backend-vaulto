import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  ProLeadEventRepositoryPort,
  RecordProLeadEventPayload,
} from "@/modules/billing/application/ports/pro-lead-event-repository.port";
import { ProLeadEventEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/pro-lead-event.entity";

@Injectable()
export class ProLeadEventTypeormRepository implements ProLeadEventRepositoryPort {
  constructor(
    @InjectRepository(ProLeadEventEntity)
    private readonly repository: Repository<ProLeadEventEntity>,
  ) {}

  async record(payload: RecordProLeadEventPayload): Promise<void> {
    const created = this.repository.create(payload);
    await this.repository.save(created);
  }
}
