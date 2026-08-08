import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  BillingPaymentRepositoryPort,
  BillingPaymentView,
  ListBillingPaymentsFilters,
  UpsertBillingPaymentPayload,
} from "@/modules/billing/application/ports/billing-payment-repository.port";
import { BillingPaymentEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/billing-payment.entity";

@Injectable()
export class BillingPaymentTypeormRepository implements BillingPaymentRepositoryPort {
  constructor(
    @InjectRepository(BillingPaymentEntity)
    private readonly repository: Repository<BillingPaymentEntity>,
  ) {}

  async upsertByGatewayPaymentId(
    payload: UpsertBillingPaymentPayload,
  ): Promise<BillingPaymentView> {
    const current = await this.repository.findOne({
      where: { gatewayPaymentId: payload.gatewayPaymentId },
    });

    const entity = this.repository.create({
      ...current,
      idUsers: payload.idUsers,
      gatewayPaymentId: payload.gatewayPaymentId,
      amount: payload.amount.toFixed(2),
      status: payload.status,
      dueDate: payload.dueDate,
      paidAt: payload.paidAt,
    });

    const saved = await this.repository.save(entity);
    return this.mapToView(saved);
  }

  async listByUser(
    idUsers: string,
    filters?: ListBillingPaymentsFilters,
  ): Promise<{ records: BillingPaymentView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const [rows, total] = await this.repository.findAndCount({
      where: { idUsers },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { records: rows.map((row) => this.mapToView(row)), total };
  }

  private mapToView(entity: BillingPaymentEntity): BillingPaymentView {
    return {
      idBillingPayment: entity.idBillingPayment,
      idUsers: entity.idUsers,
      gatewayPaymentId: entity.gatewayPaymentId,
      amount: Number(entity.amount),
      status: entity.status,
      dueDate: entity.dueDate,
      paidAt: entity.paidAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
