import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  PAYMENT_REPOSITORY,
  type PaymentRepositoryPort,
  type RegisterInstallmentPaymentCommand,
  type RegisterInstallmentPaymentResult,
} from "@/modules/payments/application/ports/payment-repository.port";

@Injectable()
export class RegisterInstallmentPaymentUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: RegisterInstallmentPaymentCommand,
  ): Promise<RegisterInstallmentPaymentResult> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    if (!Number.isFinite(command.amountPaid) || command.amountPaid <= 0) {
      throw AppException.from(APP_ERRORS.payments.invalidAmount, undefined);
    }

    return this.paymentRepository.registerInstallmentPayment(userId, command);
  }
}
