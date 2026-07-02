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
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { ListDebtsQuery } from "@/modules/debts/application/dto/get/list-debts.query";

@Injectable()
export class ListDebtsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: ListDebtsQuery,
  ): Promise<PaginatedResult<DebtView>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    const { page, limit } = resolvePagination(query?.page, query?.limit);

    const { records, total } = await this.debtRepository.listByUser(userId, {
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



