import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
} from "@/modules/accounts/application/ports/account-repository.port";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  DEBT_REPOSITORY,
  type CreateDebtInstallmentPayload,
  type CreateDebtPayload,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { CreateDebtCommand } from "@/modules/debts/application/dto/create/create-debt.command";
import { Debt } from "@/modules/debts/domain/entities/debt.entity";
import { DebtInstallmentScheduleService } from "@/modules/debts/domain/services/debt-installment-schedule.service";
import { DebtStatus } from "@/modules/debts/domain/enums/debt-status.enum";

@Injectable()
export class CreateDebtUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async execute(userId: string, command: CreateDebtCommand): Promise<DebtView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    const account = await this.accountRepository.findByIdAndUser(
      userId,
      command.idAccount,
    );

    if (!account) {
      throw AppException.from(APP_ERRORS.accounts.notFound, undefined);
    }

    const debt = Debt.create({
      idUsers: userId,
      idAccount: command.idAccount,
      title: command.title,
      description: command.description,
      debtType: command.debtType,
      totalAmount: command.totalAmount,
      startDate: command.startDate,
      hasInstallments: command.hasInstallments,
      installmentCount: command.installmentCount,
    });

    const payload = debt.toPrimitive() as CreateDebtPayload;
    const installments = DebtInstallmentScheduleService.build({
      totalAmount: payload.totalAmount,
      installmentCount: payload.installmentCount ?? 1,
      startDate: payload.startDate,
    }).map(
      (installment) =>
        ({
          ...installment.toPrimitive(),
          status: DebtStatus.OPEN,
        }) as CreateDebtInstallmentPayload,
    );

    return this.debtRepository.create(payload, installments);
  }
}



