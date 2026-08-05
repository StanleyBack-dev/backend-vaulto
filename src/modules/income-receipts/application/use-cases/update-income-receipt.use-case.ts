import { Inject, Injectable } from "@nestjs/common";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  INCOME_RECEIPT_REPOSITORY,
  type IncomeReceiptRepositoryPort,
  type RegisterInstallmentReceiptResult,
  type UpdateIncomeReceiptCommand,
} from "@/modules/income-receipts/application/ports/income-receipt-repository.port";

@Injectable()
export class UpdateIncomeReceiptUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_RECEIPT_REPOSITORY)
    private readonly incomeReceiptRepository: IncomeReceiptRepositoryPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateIncomeReceiptCommand,
  ): Promise<RegisterInstallmentReceiptResult> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    if (
      command.amountReceived !== undefined &&
      (!Number.isFinite(command.amountReceived) || command.amountReceived <= 0)
    ) {
      throw AppException.from(
        APP_ERRORS.incomeReceipts.invalidAmount,
        undefined,
      );
    }

    return this.incomeReceiptRepository.updateReceipt(userId, command);
  }
}
