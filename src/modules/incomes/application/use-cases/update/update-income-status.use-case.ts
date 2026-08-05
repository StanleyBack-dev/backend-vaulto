import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  INCOME_REPOSITORY,
  type IncomeRepositoryPort,
  type IncomeView,
} from "@/modules/incomes/application/ports/income-repository.port";
import { UpdateIncomeStatusCommand } from "@/modules/incomes/application/dto/update/update-income-status.command";
import { IncomeStatus } from "@/modules/incomes/domain/enums/income-status.enum";

@Injectable()
export class UpdateIncomeStatusUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IncomeRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateIncomeStatusCommand,
  ): Promise<IncomeView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    // RECEIVED and PARTIALLY_RECEIVED are derived automatically from
    // receivedAmount vs expectedAmount whenever the received amount is
    // updated — manually setting status here only toggles between the two
    // states that have no automatic trigger of their own.
    if (
      command.status === IncomeStatus.RECEIVED ||
      command.status === IncomeStatus.PARTIALLY_RECEIVED
    ) {
      throw AppException.from(
        APP_ERRORS.incomes.invalidManualStatusTransition,
        undefined,
      );
    }

    return this.incomeRepository.updateStatus(userId, {
      idIncome: command.idIncome,
      status: command.status,
    });
  }
}
