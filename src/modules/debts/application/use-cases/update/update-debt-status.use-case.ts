import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { UpdateDebtStatusCommand } from "@/modules/debts/application/dto/update/update-debt-status.command";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

@Injectable()
export class UpdateDebtStatusUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async execute(userId: string, command: UpdateDebtStatusCommand): Promise<DebtView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    if (
      command.status === DebtStatus.PARTIALLY_PAID ||
      command.status === DebtStatus.PAID
    ) {
      throw AppException.from(APP_ERRORS.debts.invalidManualStatusTransition, undefined);
    }

    return this.debtRepository.updateStatus(userId, {
      idDebt: command.idDebt,
      status: command.status,
    });
  }
}



