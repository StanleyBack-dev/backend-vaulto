import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  CreateReferralWithdrawalPayload,
  ReferralWithdrawalRepositoryPort,
  ReferralWithdrawalView,
  UpdateReferralWithdrawalPayload,
} from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";
import { ReferralWithdrawalEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-withdrawal.entity";

const ACTIVE_STATUSES = [
  ReferralWithdrawalStatus.REQUESTED,
  ReferralWithdrawalStatus.PROCESSING,
  ReferralWithdrawalStatus.COMPLETED,
];

function toView(entity: ReferralWithdrawalEntity): ReferralWithdrawalView {
  return {
    idReferralWithdrawal: entity.idReferralWithdrawal,
    idUsers: entity.idUsers,
    amountCents: entity.amountCents,
    pixKey: entity.pixKey,
    pixKeyType: entity.pixKeyType,
    status: entity.status,
    gatewayTransferId: entity.gatewayTransferId,
    failReason: entity.failReason,
    requestedAt: entity.requestedAt,
    processedAt: entity.processedAt,
  };
}

@Injectable()
export class ReferralWithdrawalTypeormRepository
  implements ReferralWithdrawalRepositoryPort
{
  constructor(
    @InjectRepository(ReferralWithdrawalEntity)
    private readonly repository: Repository<ReferralWithdrawalEntity>,
  ) {}

  async create(
    payload: CreateReferralWithdrawalPayload,
  ): Promise<ReferralWithdrawalView> {
    const created = this.repository.create({
      ...payload,
      status: ReferralWithdrawalStatus.REQUESTED,
    });
    const saved = await this.repository.save(created);
    return toView(saved);
  }

  async update(
    idReferralWithdrawal: string,
    payload: UpdateReferralWithdrawalPayload,
  ): Promise<ReferralWithdrawalView> {
    await this.repository.update({ idReferralWithdrawal }, payload);
    const updated = await this.repository.findOneOrFail({
      where: { idReferralWithdrawal },
    });
    return toView(updated);
  }

  async findByUser(idUsers: string): Promise<ReferralWithdrawalView[]> {
    const entities = await this.repository.find({
      where: { idUsers },
      order: { requestedAt: "DESC" },
    });
    return entities.map(toView);
  }

  async sumActiveForUser(idUsers: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder("withdrawal")
      .select("COALESCE(SUM(withdrawal.amountCents), 0)", "total")
      .where("withdrawal.idUsers = :idUsers", { idUsers })
      .andWhere("withdrawal.status IN (:...statuses)", {
        statuses: ACTIVE_STATUSES,
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }
}
