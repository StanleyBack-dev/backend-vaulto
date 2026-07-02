import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { CreateTransactionCommand } from "@/modules/transactions/application/dto/create/create-transaction.command";
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
  type TransactionView,
} from "@/modules/transactions/application/ports/transaction-repository.port";

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(userId: string, command: CreateTransactionCommand): Promise<TransactionView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_TRANSACTIONS,
    );

    if (!Number.isFinite(command.amount) || command.amount <= 0) {
      throw AppException.from(APP_ERRORS.transactions.invalidAmount, undefined);
    }

    return this.transactionRepository.create({
      idUsers: userId,
      idAccount: command.idAccount,
      type: command.type,
      amount: command.amount,
      description: command.description,
      occurredAt: command.occurredAt ?? new Date(),
    });
  }
}



