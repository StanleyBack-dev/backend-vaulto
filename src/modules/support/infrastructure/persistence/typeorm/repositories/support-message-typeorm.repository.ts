import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThanOrEqual, Repository } from "typeorm";
import type {
  CreateSupportMessagePayload,
  ListSupportTicketsParams,
  ListSupportTicketsResult,
  ReplyToSupportTicketPayload,
  SupportMessageRepositoryPort,
  SupportMessageView,
  SupportTicketView,
} from "@/modules/support/application/ports/support-message-repository.port";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";
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

  async findTicketById(
    idSupportMessage: string,
  ): Promise<SupportTicketView | null> {
    const entity = await this.repository.findOne({
      where: { idSupportMessage },
    });

    return entity ? this.mapToTicketView(entity) : null;
  }

  async listTicketsPaginated(
    params: ListSupportTicketsParams,
  ): Promise<ListSupportTicketsResult> {
    const { page, limit, filters } = params;

    const [records, total] = await this.repository.findAndCount({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.category ? { category: filters.category } : {}),
      },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      records: records.map((entity) => this.mapToTicketView(entity)),
      total,
    };
  }

  async reply(
    payload: ReplyToSupportTicketPayload,
  ): Promise<SupportTicketView> {
    await this.repository.update(
      { idSupportMessage: payload.idSupportMessage },
      {
        adminReply: payload.adminReply,
        repliedAt: payload.repliedAt,
        repliedByAdminId: payload.repliedByAdminId,
        status: SupportTicketStatus.ANSWERED,
      },
    );

    return (await this.findTicketById(payload.idSupportMessage))!;
  }

  async finalize(
    idSupportMessage: string,
    finalizedByAdminId: string,
  ): Promise<SupportTicketView> {
    await this.repository.update(
      { idSupportMessage },
      {
        status: SupportTicketStatus.RESOLVED,
        finalizedAt: new Date(),
        finalizedByAdminId,
      },
    );

    return (await this.findTicketById(idSupportMessage))!;
  }

  private mapToView(entity: SupportMessageEntity): SupportMessageView {
    return {
      category: entity.category,
      message: entity.message,
      createdAt: entity.createdAt,
    };
  }

  private mapToTicketView(entity: SupportMessageEntity): SupportTicketView {
    return {
      idSupportMessage: entity.idSupportMessage,
      idUsers: entity.idUsers,
      protocolNumber: entity.protocolNumber,
      category: entity.category,
      message: entity.message,
      status: entity.status,
      adminReply: entity.adminReply,
      repliedAt: entity.repliedAt,
      repliedByAdminId: entity.repliedByAdminId,
      finalizedAt: entity.finalizedAt,
      finalizedByAdminId: entity.finalizedByAdminId,
      createdAt: entity.createdAt,
    };
  }
}
