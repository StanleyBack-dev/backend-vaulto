import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  ReferralRewardRepositoryPort,
  ReferralRewardView,
} from "@/modules/referrals/application/ports/referral-reward-repository.port";
import { ReferralRewardStatus } from "@/modules/referrals/domain/enums/referral-reward-status.enum";
import { ReferralRewardEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-reward.entity";

function toView(entity: ReferralRewardEntity): ReferralRewardView {
  return {
    idReferralReward: entity.idReferralReward,
    idUsers: entity.idUsers,
    status: entity.status,
    grantedAt: entity.grantedAt,
    appliedAt: entity.appliedAt,
  };
}

@Injectable()
export class ReferralRewardTypeormRepository implements ReferralRewardRepositoryPort {
  constructor(
    @InjectRepository(ReferralRewardEntity)
    private readonly repository: Repository<ReferralRewardEntity>,
  ) {}

  async existsForUser(idUsers: string): Promise<boolean> {
    const count = await this.repository.count({ where: { idUsers } });
    return count > 0;
  }

  async findByUser(idUsers: string): Promise<ReferralRewardView | null> {
    const entity = await this.repository.findOne({ where: { idUsers } });
    return entity ? toView(entity) : null;
  }

  async create(idUsers: string, grantedAt: Date): Promise<void> {
    const created = this.repository.create({
      idUsers,
      status: ReferralRewardStatus.PENDING,
      grantedAt,
    });
    await this.repository.save(created);
  }

  async findPending(): Promise<ReferralRewardView[]> {
    const entities = await this.repository.find({
      where: { status: ReferralRewardStatus.PENDING },
    });
    return entities.map(toView);
  }

  async markApplied(idReferralReward: string, appliedAt: Date): Promise<void> {
    await this.repository.update(
      { idReferralReward },
      { status: ReferralRewardStatus.APPLIED, appliedAt },
    );
  }
}
