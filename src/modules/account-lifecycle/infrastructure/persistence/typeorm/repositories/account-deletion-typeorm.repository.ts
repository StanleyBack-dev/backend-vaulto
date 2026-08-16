import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThanOrEqual, Repository } from "typeorm";
import type {
  AccountDeletionRepositoryPort,
  AccountDeletionView,
  CreateAccountDeletionPayload,
} from "@/modules/account-lifecycle/application/ports/account-deletion-repository.port";
import { AccountDeletionEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deletion.entity";

function toView(entity: AccountDeletionEntity): AccountDeletionView {
  return {
    idAccountDeletion: entity.idAccountDeletion,
    idUsers: entity.idUsers,
    email: entity.email,
    reasons: entity.reasons,
    otherReason: entity.otherReason,
    requestedAt: entity.requestedAt,
    scheduledFor: entity.scheduledFor,
    cancelledAt: entity.cancelledAt,
  };
}

@Injectable()
export class AccountDeletionTypeormRepository implements AccountDeletionRepositoryPort {
  constructor(
    @InjectRepository(AccountDeletionEntity)
    private readonly repository: Repository<AccountDeletionEntity>,
  ) {}

  async create(payload: CreateAccountDeletionPayload): Promise<void> {
    const created = this.repository.create(payload);
    await this.repository.save(created);
  }

  async findPendingByUserId(
    idUsers: string,
  ): Promise<AccountDeletionView | null> {
    const entity = await this.repository.findOne({
      where: { idUsers, cancelledAt: IsNull() },
      order: { requestedAt: "DESC" },
    });

    return entity ? toView(entity) : null;
  }

  async markCancelled(
    idAccountDeletion: string,
    cancelledAt: Date,
  ): Promise<void> {
    await this.repository.update({ idAccountDeletion }, { cancelledAt });
  }

  async findDueForExecution(now: Date): Promise<AccountDeletionView[]> {
    const entities = await this.repository.find({
      where: { cancelledAt: IsNull(), scheduledFor: LessThanOrEqual(now) },
    });

    return entities.map(toView);
  }
}
