import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  AccountDeactivationRepositoryPort,
  CreateAccountDeactivationPayload,
} from "@/modules/account-lifecycle/application/ports/account-deactivation-repository.port";
import { AccountDeactivationEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deactivation.entity";

@Injectable()
export class AccountDeactivationTypeormRepository implements AccountDeactivationRepositoryPort {
  constructor(
    @InjectRepository(AccountDeactivationEntity)
    private readonly repository: Repository<AccountDeactivationEntity>,
  ) {}

  async create(payload: CreateAccountDeactivationPayload): Promise<void> {
    const created = this.repository.create(payload);
    await this.repository.save(created);
  }
}
