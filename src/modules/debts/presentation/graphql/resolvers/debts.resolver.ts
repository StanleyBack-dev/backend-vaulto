import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { RegisterDebtPaymentUseCase } from "@/modules/debts/application/use-cases/payment/register-debt-payment.use-case";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import { CreateDebtInputDto } from "@/modules/debts/presentation/graphql/dtos/create/create-debt-input.dto";
import { CreateDebtMutationResponseDto } from "@/modules/debts/presentation/graphql/dtos/create/create-debt-mutation-response.dto";
import { DebtResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-response.dto";
import { GetDebtByIdInputDto } from "@/modules/debts/presentation/graphql/dtos/get/get-debt-by-id-input.dto";
import { ListDebtsInputDto } from "@/modules/debts/presentation/graphql/dtos/get/list-debts-input.dto";
import { ListDebtsResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/list-debts-response.dto";
import { RegisterDebtPaymentInputDto } from "@/modules/debts/presentation/graphql/dtos/payment/register-debt-payment-input.dto";
import { UpdateDebtStatusInputDto } from "@/modules/debts/presentation/graphql/dtos/update/update-debt-status-input.dto";

@Resolver()
export class DebtsResolver {
  constructor(
    private readonly createDebtUseCase: CreateDebtUseCase,
    private readonly getDebtByIdUseCase: GetDebtByIdUseCase,
    private readonly listDebtsUseCase: ListDebtsUseCase,
    private readonly registerDebtPaymentUseCase: RegisterDebtPaymentUseCase,
    private readonly updateDebtStatusUseCase: UpdateDebtStatusUseCase,
  ) {}

  @Query(() => DebtResponseDto, { name: "getDebtById" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getDebtById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetDebtByIdInputDto,
  ) {
    const debt = await this.getDebtByIdUseCase.execute(user.idUsers, {
      idDebt: input.idDebt,
    });

    return DebtResponseDto.fromView(debt);
  }

  @Mutation(() => CreateDebtMutationResponseDto, { name: "createDebt" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async createDebt(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateDebtInputDto,
  ) {
    const createdDebt = await this.createDebtUseCase.execute(user.idUsers, {
      idAccount: input.idAccount,
      title: input.title,
      description: input.description,
      debtType: input.debtType,
      totalAmount: input.totalAmount,
      startDate: input.startDate,
      hasInstallments: input.hasInstallments,
      installmentCount: input.installmentCount,
    });

    return buildDataResponse(
      DebtResponseDto.fromView(createdDebt),
      RESPONSE_MESSAGES.debts.created,
    );
  }

  @Query(() => ListDebtsResponseDto, { name: "getMyDebts" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyDebts(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListDebtsInputDto,
  ) {
    const result = await this.listDebtsUseCase.execute(user.idUsers, input);

    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => DebtResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.debts.listed,
    );
  }

  @Mutation(() => CreateDebtMutationResponseDto, { name: "registerDebtPayment" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async registerDebtPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RegisterDebtPaymentInputDto,
  ) {
    const updatedDebt = await this.registerDebtPaymentUseCase.execute(user.idUsers, {
      idDebt: input.idDebt,
      amountPaid: input.amountPaid,
      paidAt: input.paidAt,
    });

    return buildDataResponse(
      DebtResponseDto.fromView(updatedDebt),
      RESPONSE_MESSAGES.debts.paymentRegistered,
    );
  }

  @Mutation(() => CreateDebtMutationResponseDto, { name: "updateDebtStatus" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateDebtStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateDebtStatusInputDto,
  ) {
    const updatedDebt = await this.updateDebtStatusUseCase.execute(user.idUsers, {
      idDebt: input.idDebt,
      status: input.status,
    });

    return buildDataResponse(
      DebtResponseDto.fromView(updatedDebt),
      RESPONSE_MESSAGES.debts.statusUpdated,
    );
  }
}


