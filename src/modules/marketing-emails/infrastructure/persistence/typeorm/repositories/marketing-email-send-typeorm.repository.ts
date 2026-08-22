import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  CreateMarketingEmailSendPayload,
  ListMarketingEmailSendsFilters,
  ListMarketingEmailSendsParams,
  ListMarketingEmailSendsResult,
  MarketingEmailRepositoryPort,
  MarketingEmailSendView,
} from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";
import { MarketingEmailSendEntity } from "@/modules/marketing-emails/infrastructure/persistence/typeorm/entities/marketing-email-send.entity";

@Injectable()
export class MarketingEmailSendTypeormRepository implements MarketingEmailRepositoryPort {
  constructor(
    @InjectRepository(MarketingEmailSendEntity)
    private readonly repository: Repository<MarketingEmailSendEntity>,
  ) {}

  async create(
    payload: CreateMarketingEmailSendPayload,
  ): Promise<MarketingEmailSendView> {
    const created = this.repository.create(payload);
    const saved = await this.repository.save(created);

    return this.mapToView(saved);
  }

  async findMostRecentSendForEmail(
    recipientEmail: string,
  ): Promise<MarketingEmailSendView | null> {
    const entity = await this.repository.findOne({
      where: { recipientEmail },
      order: { createdAt: "DESC" },
    });

    return entity ? this.mapToView(entity) : null;
  }

  async listPaginated(
    params: ListMarketingEmailSendsParams,
  ): Promise<ListMarketingEmailSendsResult> {
    const { page, limit, filters } = params;

    const [records, total] = await this.repository.findAndCount({
      where: this.buildWhere(filters),
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      records: records.map((entity) => this.mapToView(entity)),
      total,
    };
  }

  async listAll(
    filters?: ListMarketingEmailSendsFilters,
  ): Promise<MarketingEmailSendView[]> {
    const records = await this.repository.find({
      where: this.buildWhere(filters),
      order: { createdAt: "DESC" },
    });

    return records.map((entity) => this.mapToView(entity));
  }

  private buildWhere(filters?: ListMarketingEmailSendsFilters) {
    return {
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.recipientEmail
        ? { recipientEmail: filters.recipientEmail }
        : {}),
    };
  }

  private mapToView(entity: MarketingEmailSendEntity): MarketingEmailSendView {
    return {
      idMarketingEmailSend: entity.idMarketingEmailSend,
      category: entity.category,
      recipientEmail: entity.recipientEmail,
      recipientName: entity.recipientName,
      recipientPhone: entity.recipientPhone,
      subject: entity.subject,
      bodyMarkdown: entity.bodyMarkdown,
      partnershipPercentage: entity.partnershipPercentage,
      sentByAdminId: entity.sentByAdminId,
      createdAt: entity.createdAt,
    };
  }
}
