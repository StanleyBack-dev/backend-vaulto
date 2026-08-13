import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ListDebtPaymentsUseCase } from "@/modules/payments/application/use-cases/list-debt-payments.use-case";
import { RegisterInstallmentPaymentUseCase } from "@/modules/payments/application/use-cases/register-installment-payment.use-case";
import { UpdateDebtPaymentUseCase } from "@/modules/payments/application/use-cases/update-debt-payment.use-case";
import { DeleteDebtPaymentUseCase } from "@/modules/payments/application/use-cases/delete-debt-payment.use-case";
import { DebtPaymentResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-payment-response.dto";
import { RegisterInstallmentPaymentInputDto } from "@/modules/payments/presentation/graphql/dtos/register-installment-payment-input.dto";
import { RegisterInstallmentPaymentMutationResponseDto } from "@/modules/payments/presentation/graphql/dtos/register-installment-payment-mutation-response.dto";
import { RegisterInstallmentPaymentResponseDto } from "@/modules/payments/presentation/graphql/dtos/register-installment-payment-response.dto";
import { UpdateDebtPaymentInputDto } from "@/modules/payments/presentation/graphql/dtos/update-debt-payment-input.dto";
import { UpdateDebtPaymentMutationResponseDto } from "@/modules/payments/presentation/graphql/dtos/update-debt-payment-mutation-response.dto";
import { DeleteDebtPaymentMutationResponseDto } from "@/modules/payments/presentation/graphql/dtos/delete-debt-payment-mutation-response.dto";

@Resolver()
@RequirePageAccess(PageAccessKey.PAYMENTS)
export class PaymentsResolver {
  constructor(
    private readonly registerInstallmentPaymentUseCase: RegisterInstallmentPaymentUseCase,
    private readonly listDebtPaymentsUseCase: ListDebtPaymentsUseCase,
    private readonly updateDebtPaymentUseCase: UpdateDebtPaymentUseCase,
    private readonly deleteDebtPaymentUseCase: DeleteDebtPaymentUseCase,
  ) {}

  @Mutation(() => RegisterInstallmentPaymentMutationResponseDto, {
    name: "registerInstallmentPayment",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async registerInstallmentPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RegisterInstallmentPaymentInputDto,
  ) {
    const result = await this.registerInstallmentPaymentUseCase.execute(
      user.idUsers,
      {
        idDebt: input.idDebt,
        idDebtInstallment: input.idDebtInstallment,
        amountPaid: input.amountPaid,
        paidAt: input.paidAt,
      },
    );

    return buildDataResponse(
      RegisterInstallmentPaymentResponseDto.fromResult(result),
      RESPONSE_MESSAGES.payments.registered,
    );
  }

  @Mutation(() => UpdateDebtPaymentMutationResponseDto, {
    name: "updateDebtPayment",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateDebtPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateDebtPaymentInputDto,
  ) {
    const result = await this.updateDebtPaymentUseCase.execute(user.idUsers, {
      idDebtPayment: input.idDebtPayment,
      amountPaid: input.amountPaid,
      paidAt: input.paidAt,
    });

    return buildDataResponse(
      RegisterInstallmentPaymentResponseDto.fromResult(result),
      RESPONSE_MESSAGES.payments.updated,
    );
  }

  @Mutation(() => DeleteDebtPaymentMutationResponseDto, {
    name: "deleteDebtPayment",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async deleteDebtPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idDebtPayment") idDebtPayment: string,
  ) {
    const result = await this.deleteDebtPaymentUseCase.execute(
      user.idUsers,
      idDebtPayment,
    );

    return buildDataResponse(
      RegisterInstallmentPaymentResponseDto.fromResult(result),
      RESPONSE_MESSAGES.payments.deleted,
    );
  }

  @Query(() => [DebtPaymentResponseDto], { name: "getDebtPayments" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getDebtPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idDebt") idDebt: string,
  ) {
    const payments = await this.listDebtPaymentsUseCase.execute(
      user.idUsers,
      idDebt,
    );

    return payments.map((payment) => DebtPaymentResponseDto.fromView(payment));
  }
}
