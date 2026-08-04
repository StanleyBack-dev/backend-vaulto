import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  PAYMENT_REPOSITORY,
  type PaymentRepositoryPort,
  type RegisterInstallmentPaymentResult,
} from "@/modules/payments/application/ports/payment-repository.port";

@Injectable()
export class DeleteDebtPaymentUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(
    userId: string,
    idDebtPayment: string,
  ): Promise<RegisterInstallmentPaymentResult> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    return this.paymentRepository.deletePayment(userId, idDebtPayment);
  }
}
