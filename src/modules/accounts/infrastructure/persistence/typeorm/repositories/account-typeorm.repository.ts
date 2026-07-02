import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  type AccountTransferView,
  type AccountRepositoryPort,
  type AccountView,
  type CreateAccountPayload,
  type TransferBetweenAccountsPayload,
  type TransferBetweenAccountsResult,
} from "@/modules/accounts/application/ports/account-repository.port";
import { AccountEntity } from "@/modules/accounts/infrastructure/persistence/typeorm/entities/account.entity";
import { AccountTransferEntity } from "@/modules/accounts/infrastructure/persistence/typeorm/entities/account-transfer.entity";

@Injectable()
export class AccountTypeormRepository implements AccountRepositoryPort {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AccountEntity)
    private readonly repository: Repository<AccountEntity>,
  ) {}

  async create(payload: CreateAccountPayload): Promise<AccountView> {
    const created = this.repository.create({
      idUsers: payload.idUsers,
      name: payload.name,
      accountType: payload.accountType,
      initialBalance: payload.initialBalance.toFixed(2),
      currentBalance: payload.initialBalance.toFixed(2),
    });

    const saved = await this.repository.save(created);
    return this.mapToView(saved);
  }

  async listByUser(idUsers: string): Promise<AccountView[]> {
    const rows = await this.repository.find({
      where: { idUsers },
      order: { createdAt: "DESC" },
    });

    return rows.map((row) => this.mapToView(row));
  }

  async findByIdAndUser(
    idUsers: string,
    idAccount: string,
  ): Promise<AccountView | null> {
    const row = await this.repository.findOne({
      where: { idUsers, idAccount, isActive: true },
    });

    return row ? this.mapToView(row) : null;
  }

  async transferBetweenAccounts(
    payload: TransferBetweenAccountsPayload,
  ): Promise<TransferBetweenAccountsResult> {
    return this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(AccountEntity);
      const transferRepository = manager.getRepository(AccountTransferEntity);

      const [source, destination] = await Promise.all([
        accountRepository.findOne({
          where: {
            idUsers: payload.idUsers,
            idAccount: payload.sourceAccountId,
            isActive: true,
          },
        }),
        accountRepository.findOne({
          where: {
            idUsers: payload.idUsers,
            idAccount: payload.destinationAccountId,
            isActive: true,
          },
        }),
      ]);

      if (!source || !destination) {
        throw AppException.from(APP_ERRORS.accounts.notFound, undefined);
      }

      const sourceBalance = Number(source.currentBalance);
      if (sourceBalance < payload.amount) {
        throw AppException.from(APP_ERRORS.accounts.insufficientBalance, undefined);
      }

      source.currentBalance = (sourceBalance - payload.amount).toFixed(2);
      destination.currentBalance = (
        Number(destination.currentBalance) + payload.amount
      ).toFixed(2);

      const [savedSource, savedDestination] = await accountRepository.save([
        source,
        destination,
      ]);

      const transfer = transferRepository.create({
        idUsers: payload.idUsers,
        sourceAccountId: payload.sourceAccountId,
        destinationAccountId: payload.destinationAccountId,
        amount: payload.amount.toFixed(2),
        description: payload.description,
        transferredAt: payload.transferredAt ?? new Date(),
      });

      const savedTransfer = await transferRepository.save(transfer);

      return {
        sourceAccount: this.mapToView(savedSource),
        destinationAccount: this.mapToView(savedDestination),
        transfer: this.mapTransferToView(savedTransfer),
      };
    });
  }

  private mapToView(entity: AccountEntity): AccountView {
    return {
      idAccount: entity.idAccount,
      idUsers: entity.idUsers,
      name: entity.name,
      accountType: entity.accountType,
      initialBalance: Number(entity.initialBalance),
      currentBalance: Number(entity.currentBalance),
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapTransferToView(entity: AccountTransferEntity): AccountTransferView {
    return {
      idAccountTransfer: entity.idAccountTransfer,
      idUsers: entity.idUsers,
      sourceAccountId: entity.sourceAccountId,
      destinationAccountId: entity.destinationAccountId,
      amount: Number(entity.amount),
      description: entity.description,
      transferredAt: entity.transferredAt,
      createdAt: entity.createdAt,
    };
  }
}
