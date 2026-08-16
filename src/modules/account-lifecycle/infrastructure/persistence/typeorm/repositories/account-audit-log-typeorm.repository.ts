import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  AccountAuditLogRepositoryPort,
  RecordAccountAuditEventPayload,
} from "@/modules/account-lifecycle/application/ports/account-audit-log-repository.port";
import { AccountAuditLogEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-audit-log.entity";

@Injectable()
export class AccountAuditLogTypeormRepository implements AccountAuditLogRepositoryPort {
  constructor(
    @InjectRepository(AccountAuditLogEntity)
    private readonly repository: Repository<AccountAuditLogEntity>,
  ) {}

  async record(payload: RecordAccountAuditEventPayload): Promise<void> {
    const created = this.repository.create(payload);
    await this.repository.save(created);
  }
}
