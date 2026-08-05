import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
  type IncomeView,
} from "@/modules/incomes/application/ports/income-repository.port";
import { ListIncomesQuery } from "@/modules/incomes/application/dto/get/list-incomes.query";

@Injectable()
export class ListIncomesUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: ListIncomesQuery,
  ): Promise<PaginatedResult<IncomeView>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    const { page, limit } = resolvePagination(query?.page, query?.limit);

    const { records, total } = await this.incomeRepository.listByUser(userId, {
      ...query,
      page,
      limit,
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
