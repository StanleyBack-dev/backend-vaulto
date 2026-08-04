import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  PAYMENT_REPOSITORY,
  type DebtPaymentView,
  type PaymentRepositoryPort,
} from "@/modules/payments/application/ports/payment-repository.port";

@Injectable()
export class ListDebtPaymentsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(userId: string, idDebt: string): Promise<DebtPaymentView[]> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    return this.paymentRepository.listPaymentsForDebt(userId, idDebt);
  }
}
