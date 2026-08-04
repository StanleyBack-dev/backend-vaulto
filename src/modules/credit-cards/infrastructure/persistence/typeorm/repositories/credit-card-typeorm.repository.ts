import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import type {
  CreditCardRepositoryPort,
  CreditCardView,
  CreateCreditCardPayload,
  UpdateCreditCardPayload,
} from "@/modules/credit-cards/application/ports/credit-card-repository.port";
import type { ListCreditCardsQuery } from "@/modules/credit-cards/application/dto/get/list-credit-cards.query";
import { CreditCardEntity } from "@/modules/credit-cards/infrastructure/persistence/typeorm/entities/credit-card.entity";

type UsedLimitRawRow = {
  idCreditCard: string;
  used: string | null;
};

@Injectable()
export class CreditCardTypeormRepository implements CreditCardRepositoryPort {
  constructor(
    @InjectRepository(CreditCardEntity)
    private readonly repository: Repository<CreditCardEntity>,
    @InjectRepository(DebtInstallmentEntity)
    private readonly installmentRepository: Repository<DebtInstallmentEntity>,
  ) {}

  async create(payload: CreateCreditCardPayload): Promise<CreditCardView> {
    const created = this.repository.create({
      idUsers: payload.idUsers,
      name: payload.name,
      creditLimit: payload.creditLimit.toFixed(2),
      dueDay: payload.dueDay,
      closingDay: payload.closingDay,
      status: payload.status ?? true,
      inactivatedAt: payload.status === false ? new Date() : undefined,
    });

    const saved = await this.repository.save(created);
    return this.mapToView(saved, 0);
  }

  async update(payload: UpdateCreditCardPayload): Promise<CreditCardView> {
    const current = await this.repository.findOne({
      where: { idUsers: payload.idUsers, idCreditCard: payload.idCreditCard },
    });

    if (!current) {
      throw AppException.from(APP_ERRORS.creditCards.notFound, undefined);
    }

    current.name = payload.name;
    current.creditLimit = payload.creditLimit.toFixed(2);
    current.dueDay = payload.dueDay;
    current.closingDay = payload.closingDay;
    current.status = payload.status;
    current.inactivatedAt = payload.status ? undefined : new Date();

    const saved = await this.repository.save(current);
    const usedLimit = await this.computeUsedLimit(saved.idCreditCard);
    return this.mapToView(saved, usedLimit);
  }

  async findById(
    idUsers: string,
    idCreditCard: string,
  ): Promise<CreditCardView | null> {
    const row = await this.repository.findOne({
      where: { idUsers, idCreditCard },
    });

    if (!row) {
      return null;
    }

    const usedLimit = await this.computeUsedLimit(row.idCreditCard);
    return this.mapToView(row, usedLimit);
  }

  async findByName(
    idUsers: string,
    name: string,
  ): Promise<CreditCardView | null> {
    const row = await this.repository.findOne({
      where: { idUsers, name: ILike(name.trim()) },
    });

    if (!row) {
      return null;
    }

    const usedLimit = await this.computeUsedLimit(row.idCreditCard);
    return this.mapToView(row, usedLimit);
  }

  async listByUser(
    idUsers: string,
    query?: ListCreditCardsQuery,
  ): Promise<{ records: CreditCardView[]; total: number }> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const qb = this.repository
      .createQueryBuilder("creditCard")
      .where("creditCard.idUsers = :idUsers", { idUsers })
      .orderBy("creditCard.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (typeof query?.status === "boolean") {
      qb.andWhere("creditCard.status = :status", { status: query.status });
    }

    const [rows, total] = await qb.getManyAndCount();

    const ids = rows.map((row) => row.idCreditCard);
    const usedLimitById = await this.computeUsedLimits(ids);

    return {
      records: rows.map((row) =>
        this.mapToView(row, usedLimitById.get(row.idCreditCard) ?? 0),
      ),
      total,
    };
  }

  private async computeUsedLimit(idCreditCard: string): Promise<number> {
    const usedLimitById = await this.computeUsedLimits([idCreditCard]);
    return usedLimitById.get(idCreditCard) ?? 0;
  }

  private async computeUsedLimits(ids: string[]): Promise<Map<string, number>> {
    const usedLimitById = new Map<string, number>();

    if (!ids.length) {
      return usedLimitById;
    }

    const rows = await this.installmentRepository
      .createQueryBuilder("installment")
      .innerJoin(
        DebtEntity,
        "debt",
        "CAST(debt.idDebt AS varchar) = installment.idDebt",
      )
      .where("debt.idCreditCard IN (:...ids)", { ids })
      .select("debt.idCreditCard", "idCreditCard")
      .addSelect("SUM(installment.amountDue - installment.amountPaid)", "used")
      .groupBy("debt.idCreditCard")
      .getRawMany<UsedLimitRawRow>();

    for (const row of rows) {
      usedLimitById.set(row.idCreditCard, Number(row.used) || 0);
    }

    return usedLimitById;
  }

  private mapToView(
    entity: CreditCardEntity,
    usedLimit: number,
  ): CreditCardView {
    const creditLimit = Number(entity.creditLimit);
    const roundedUsed = Number(usedLimit.toFixed(2));

    return {
      idCreditCard: entity.idCreditCard,
      idUsers: entity.idUsers,
      name: entity.name,
      creditLimit,
      dueDay: entity.dueDay,
      closingDay: entity.closingDay,
      status: entity.status,
      usedLimit: roundedUsed,
      availableLimit: Number(Math.max(creditLimit - roundedUsed, 0).toFixed(2)),
      inactivatedAt: entity.inactivatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
