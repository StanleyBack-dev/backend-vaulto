import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
  type TransferBetweenAccountsPayload,
  type TransferBetweenAccountsResult,
} from "@/modules/accounts/application/ports/account-repository.port";
import { TransferBetweenAccountsCommand } from "@/modules/accounts/application/dto/transfer/transfer-between-accounts.command";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";

@Injectable()
export class TransferBetweenAccountsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: TransferBetweenAccountsCommand,
  ): Promise<TransferBetweenAccountsResult> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_ACCOUNTS,
    );

    if (command.sourceAccountId === command.destinationAccountId) {
      throw AppException.from(APP_ERRORS.accounts.transferSameAccountNotAllowed, undefined);
    }

    if (!Number.isFinite(command.amount) || command.amount <= 0) {
      throw AppException.from(APP_ERRORS.accounts.invalidTransferAmount, undefined);
    }

    const payload: TransferBetweenAccountsPayload = {
      idUsers: userId,
      sourceAccountId: command.sourceAccountId,
      destinationAccountId: command.destinationAccountId,
      amount: command.amount,
      description: command.description,
      transferredAt: command.transferredAt,
    };

    return this.accountRepository.transferBetweenAccounts(payload);
  }
}



