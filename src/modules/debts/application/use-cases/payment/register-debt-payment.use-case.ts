import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  DEBT_REPOSITORY,
  type DebtRepositoryPort,
  type DebtView,
} from "@/modules/debts/application/ports/debt-repository.port";
import { RegisterDebtPaymentCommand } from "@/modules/debts/application/dto/payment/register-debt-payment.command";

@Injectable()
export class RegisterDebtPaymentUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(DEBT_REPOSITORY)
    private readonly debtRepository: DebtRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: RegisterDebtPaymentCommand,
  ): Promise<DebtView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    return this.debtRepository.registerPayment(userId, {
      idDebt: command.idDebt,
      amountPaid: command.amountPaid,
      paidAt: command.paidAt,
    });
  }
}



