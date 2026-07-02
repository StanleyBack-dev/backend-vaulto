import { Inject, Injectable } from "@nestjs/common";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { ListTransactionsQuery } from "@/modules/transactions/application/dto/get/list-transactions.query";
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepositoryPort,
  type TransactionView,
} from "@/modules/transactions/application/ports/transaction-repository.port";

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: ListTransactionsQuery,
  ): Promise<PaginatedResult<TransactionView>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_TRANSACTIONS,
    );

    const { page, limit } = resolvePagination(query?.page, query?.limit);

    const { records, total } = await this.transactionRepository.listByUser(userId, {
      page,
      limit,
      idAccount: query?.idAccount,
      type: query?.type,
    });

    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }
}



