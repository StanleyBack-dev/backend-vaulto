import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
  type IncomeView,
} from "@/modules/incomes/application/ports/income-repository.port";
import { GetIncomeByIdQuery } from "@/modules/incomes/application/dto/get/get-income-by-id.query";

@Injectable()
export class GetIncomeByIdUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
  ) {}

  async execute(
    userId: string,
    query: GetIncomeByIdQuery,
  ): Promise<IncomeView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    return this.incomeRepository.findById(userId, query.idIncome);
  }
}
