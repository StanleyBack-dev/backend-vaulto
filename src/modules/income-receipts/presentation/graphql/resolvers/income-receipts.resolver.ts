import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ListIncomeReceiptsUseCase } from "@/modules/income-receipts/application/use-cases/list-income-receipts.use-case";
import { RegisterInstallmentReceiptUseCase } from "@/modules/income-receipts/application/use-cases/register-installment-receipt.use-case";
import { UpdateIncomeReceiptUseCase } from "@/modules/income-receipts/application/use-cases/update-income-receipt.use-case";
import { DeleteIncomeReceiptUseCase } from "@/modules/income-receipts/application/use-cases/delete-income-receipt.use-case";
import { IncomeReceiptResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/income-receipt-response.dto";
import { RegisterInstallmentReceiptInputDto } from "@/modules/income-receipts/presentation/graphql/dtos/register-installment-receipt-input.dto";
import { RegisterInstallmentReceiptMutationResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/register-installment-receipt-mutation-response.dto";
import { RegisterInstallmentReceiptResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/register-installment-receipt-response.dto";
import { UpdateIncomeReceiptInputDto } from "@/modules/income-receipts/presentation/graphql/dtos/update-income-receipt-input.dto";
import { UpdateIncomeReceiptMutationResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/update-income-receipt-mutation-response.dto";
import { DeleteIncomeReceiptMutationResponseDto } from "@/modules/income-receipts/presentation/graphql/dtos/delete-income-receipt-mutation-response.dto";

@Resolver()
@RequirePageAccess(PageAccessKey.INCOME_RECEIPTS)
export class IncomeReceiptsResolver {
  constructor(
    private readonly registerInstallmentReceiptUseCase: RegisterInstallmentReceiptUseCase,
    private readonly listIncomeReceiptsUseCase: ListIncomeReceiptsUseCase,
    private readonly updateIncomeReceiptUseCase: UpdateIncomeReceiptUseCase,
    private readonly deleteIncomeReceiptUseCase: DeleteIncomeReceiptUseCase,
  ) {}

  @Mutation(() => RegisterInstallmentReceiptMutationResponseDto, {
    name: "registerInstallmentReceipt",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async registerInstallmentReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RegisterInstallmentReceiptInputDto,
  ) {
    const result = await this.registerInstallmentReceiptUseCase.execute(
      user.idUsers,
      {
        idIncome: input.idIncome,
        idIncomeInstallment: input.idIncomeInstallment,
        amountReceived: input.amountReceived,
        receivedAt: input.receivedAt,
      },
    );

    return buildDataResponse(
      RegisterInstallmentReceiptResponseDto.fromResult(result),
      RESPONSE_MESSAGES.incomeReceipts.registered,
    );
  }

  @Mutation(() => UpdateIncomeReceiptMutationResponseDto, {
    name: "updateIncomeReceipt",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateIncomeReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateIncomeReceiptInputDto,
  ) {
    const result = await this.updateIncomeReceiptUseCase.execute(user.idUsers, {
      idIncomeReceipt: input.idIncomeReceipt,
      amountReceived: input.amountReceived,
      receivedAt: input.receivedAt,
    });

    return buildDataResponse(
      RegisterInstallmentReceiptResponseDto.fromResult(result),
      RESPONSE_MESSAGES.incomeReceipts.updated,
    );
  }

  @Mutation(() => DeleteIncomeReceiptMutationResponseDto, {
    name: "deleteIncomeReceipt",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async deleteIncomeReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idIncomeReceipt") idIncomeReceipt: string,
  ) {
    const result = await this.deleteIncomeReceiptUseCase.execute(
      user.idUsers,
      idIncomeReceipt,
    );

    return buildDataResponse(
      RegisterInstallmentReceiptResponseDto.fromResult(result),
      RESPONSE_MESSAGES.incomeReceipts.deleted,
    );
  }

  @Query(() => [IncomeReceiptResponseDto], { name: "getIncomeReceipts" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getIncomeReceipts(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idIncome") idIncome: string,
  ) {
    const receipts = await this.listIncomeReceiptsUseCase.execute(
      user.idUsers,
      idIncome,
    );

    return receipts.map((receipt) =>
      IncomeReceiptResponseDto.fromView(receipt),
    );
  }
}
