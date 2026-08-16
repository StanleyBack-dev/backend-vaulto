import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  FINANCIAL_GOAL_REPOSITORY,
  type FinancialGoalRepositoryPort,
  type FinancialGoalView,
} from "@/modules/goals/application/ports/financial-goal-repository.port";
import { ListFinancialGoalsQuery } from "@/modules/goals/application/dto/get/list-financial-goals.query";

@Injectable()
export class ListFinancialGoalsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(FINANCIAL_GOAL_REPOSITORY)
    private readonly goalRepository: FinancialGoalRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query?: ListFinancialGoalsQuery,
  ): Promise<PaginatedResult<FinancialGoalView>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    const { page, limit } = resolvePagination(query?.page, query?.limit);

    const { records, total } = await this.goalRepository.listByUser(userId, {
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
