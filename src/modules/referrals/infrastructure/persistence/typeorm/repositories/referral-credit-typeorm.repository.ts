import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import type {
  CreateReferralCreditPayload,
  ReferralCreditRepositoryPort,
  ReferralCreditView,
} from "@/modules/referrals/application/ports/referral-credit-repository.port";
import { ReferralCreditStatus } from "@/modules/referrals/domain/enums/referral-credit-status.enum";
import { ReferralCreditEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-credit.entity";

function toView(entity: ReferralCreditEntity): ReferralCreditView {
  return {
    idReferralCredit: entity.idReferralCredit,
    idUsers: entity.idUsers,
    idReferredUser: entity.idReferredUser,
    amountCents: entity.amountCents,
    status: entity.status,
    qualifiedAt: entity.qualifiedAt,
    availableAt: entity.availableAt,
    clawedBackAt: entity.clawedBackAt,
  };
}

@Injectable()
export class ReferralCreditTypeormRepository implements ReferralCreditRepositoryPort {
  constructor(
    @InjectRepository(ReferralCreditEntity)
    private readonly repository: Repository<ReferralCreditEntity>,
  ) {}

  async create(
    payload: CreateReferralCreditPayload,
  ): Promise<ReferralCreditView> {
    const created = this.repository.create({
      ...payload,
      status: ReferralCreditStatus.PENDING_HOLD,
    });
    const saved = await this.repository.save(created);
    return toView(saved);
  }

  async findDueForPromotion(now: Date): Promise<ReferralCreditView[]> {
    const entities = await this.repository.find({
      where: {
        status: ReferralCreditStatus.PENDING_HOLD,
        availableAt: LessThanOrEqual(now),
      },
    });
    return entities.map(toView);
  }

  async findPendingByReferredUser(
    idReferredUser: string,
  ): Promise<ReferralCreditView | null> {
    const entity = await this.repository.findOne({
      where: {
        idReferredUser,
        status: ReferralCreditStatus.PENDING_HOLD,
      },
    });
    return entity ? toView(entity) : null;
  }

  async markAvailable(idReferralCredit: string): Promise<void> {
    await this.repository.update(
      { idReferralCredit },
      { status: ReferralCreditStatus.AVAILABLE },
    );
  }

  async markClawedBack(
    idReferralCredit: string,
    clawedBackAt: Date,
  ): Promise<void> {
    await this.repository.update(
      { idReferralCredit },
      { status: ReferralCreditStatus.CLAWED_BACK, clawedBackAt },
    );
  }

  async sumAvailableForUser(idUsers: string): Promise<number> {
    return this.sumForUserByStatus(idUsers, ReferralCreditStatus.AVAILABLE);
  }

  async sumPendingHoldForUser(idUsers: string): Promise<number> {
    return this.sumForUserByStatus(idUsers, ReferralCreditStatus.PENDING_HOLD);
  }

  private async sumForUserByStatus(
    idUsers: string,
    status: ReferralCreditStatus,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder("credit")
      .select("COALESCE(SUM(credit.amountCents), 0)", "total")
      .where("CAST(credit.idUsers AS varchar) = CAST(:idUsers AS varchar)", {
        idUsers,
      })
      .andWhere("credit.status = :status", { status })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }
}
