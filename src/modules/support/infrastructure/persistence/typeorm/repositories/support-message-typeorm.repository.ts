import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThanOrEqual, Repository } from "typeorm";
import type {
  CreateSupportMessagePayload,
  SupportMessageRepositoryPort,
  SupportMessageView,
} from "@/modules/support/application/ports/support-message-repository.port";
import { SupportMessageEntity } from "@/modules/support/infrastructure/persistence/typeorm/entities/support-message.entity";

@Injectable()
export class SupportMessageTypeormRepository implements SupportMessageRepositoryPort {
  constructor(
    @InjectRepository(SupportMessageEntity)
    private readonly repository: Repository<SupportMessageEntity>,
  ) {}

  async create(
    payload: CreateSupportMessagePayload,
  ): Promise<SupportMessageView> {
    const created = this.repository.create(payload);
    const saved = await this.repository.save(created);

    return this.mapToView(saved);
  }

  async hasMessageSince(idUsers: string, since: Date): Promise<boolean> {
    const count = await this.repository.count({
      where: { idUsers, createdAt: MoreThanOrEqual(since) },
    });

    return count > 0;
  }

  private mapToView(entity: SupportMessageEntity): SupportMessageView {
    return {
      category: entity.category,
      message: entity.message,
      createdAt: entity.createdAt,
    };
  }
}
