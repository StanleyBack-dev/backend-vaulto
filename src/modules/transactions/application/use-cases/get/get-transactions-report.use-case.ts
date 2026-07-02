import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { GetTransactionsReportQuery } from "@/modules/transactions/application/dto/get/get-transactions-report.query";
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
  type TransactionsReportView,
} from "@/modules/transactions/application/ports/transaction-repository.port";

@Injectable()
export class GetTransactionsReportUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: GetTransactionsReportQuery,
  ): Promise<TransactionsReportView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_TRANSACTIONS,
    );

    return this.transactionRepository.getReportByUser(userId, query);
  }
}



