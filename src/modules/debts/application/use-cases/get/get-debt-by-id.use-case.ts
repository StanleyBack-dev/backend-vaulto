import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { GetDebtByIdQuery } from "@/modules/debts/application/dto/get/get-debt-by-id.query";

@Injectable()
export class GetDebtByIdUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async execute(userId: string, query: GetDebtByIdQuery): Promise<DebtView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    return this.debtRepository.findById(userId, query.idDebt);
  }
}



