import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  INCOME_RECEIPT_REPOSITORY,
  type IncomeReceiptRepositoryPort,
  type RegisterInstallmentReceiptResult,
} from "@/modules/income-receipts/application/ports/income-receipt-repository.port";

@Injectable()
export class DeleteIncomeReceiptUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(INCOME_RECEIPT_REPOSITORY)
    private readonly incomeReceiptRepository: IncomeReceiptRepositoryPort,
  ) {}

  async execute(
    userId: string,
    idIncomeReceipt: string,
  ): Promise<RegisterInstallmentReceiptResult> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_DEBTS,
    );

    return this.incomeReceiptRepository.deleteReceipt(userId, idIncomeReceipt);
  }
}
