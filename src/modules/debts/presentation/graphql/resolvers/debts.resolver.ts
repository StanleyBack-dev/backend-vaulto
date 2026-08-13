import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
  buildSuccessResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateDebtUseCase } from "@/modules/debts/application/use-cases/create/create-debt.use-case";
import { DeleteDebtUseCase } from "@/modules/debts/application/use-cases/delete/delete-debt.use-case";
import { GetDebtByIdUseCase } from "@/modules/debts/application/use-cases/get/get-debt-by-id.use-case";
import { ListDebtsUseCase } from "@/modules/debts/application/use-cases/get/list-debts.use-case";
import { UpdateDebtDetailsUseCase } from "@/modules/debts/application/use-cases/update/update-debt-details.use-case";
import { UpdateDebtStatusUseCase } from "@/modules/debts/application/use-cases/update/update-debt-status.use-case";
import { CreateDebtInputDto } from "@/modules/debts/presentation/graphql/dtos/create/create-debt-input.dto";
import { CreateDebtMutationResponseDto } from "@/modules/debts/presentation/graphql/dtos/create/create-debt-mutation-response.dto";
import { DeleteDebtResponseDto } from "@/modules/debts/presentation/graphql/dtos/delete/delete-debt-response.dto";
import { DebtResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/debt-response.dto";
import { GetDebtByIdInputDto } from "@/modules/debts/presentation/graphql/dtos/get/get-debt-by-id-input.dto";
import { ListDebtsInputDto } from "@/modules/debts/presentation/graphql/dtos/get/list-debts-input.dto";
import { ListDebtsResponseDto } from "@/modules/debts/presentation/graphql/dtos/get/list-debts-response.dto";
import { UpdateDebtDetailsInputDto } from "@/modules/debts/presentation/graphql/dtos/update/update-debt-details-input.dto";
import { UpdateDebtStatusInputDto } from "@/modules/debts/presentation/graphql/dtos/update/update-debt-status-input.dto";

@Resolver()
export class DebtsResolver {
  constructor(
    private readonly createDebtUseCase: CreateDebtUseCase,
    private readonly getDebtByIdUseCase: GetDebtByIdUseCase,
    private readonly listDebtsUseCase: ListDebtsUseCase,
    private readonly updateDebtDetailsUseCase: UpdateDebtDetailsUseCase,
    private readonly updateDebtStatusUseCase: UpdateDebtStatusUseCase,
    private readonly deleteDebtUseCase: DeleteDebtUseCase,
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
  @RequirePageAccess(PageAccessKey.DEBTS)
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async createDebt(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateDebtInputDto,
  ) {
    const createdDebt = await this.createDebtUseCase.execute(user.idUsers, {
      title: input.title,
      idCategory: input.idCategory,
      idCreditCard: input.idCreditCard,
      description: input.description,
      debtType: input.debtType,
      totalAmount: input.totalAmount,
      dueDate: input.dueDate,
      acquiredAt: input.acquiredAt,
      hasInstallments: input.hasInstallments,
      installmentCount: input.installmentCount,
      installmentAmount: input.installmentAmount,
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

  @Mutation(() => CreateDebtMutationResponseDto, { name: "updateDebtDetails" })
  @RequirePageAccess(PageAccessKey.DEBTS)
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateDebtDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateDebtDetailsInputDto,
  ) {
    const updatedDebt = await this.updateDebtDetailsUseCase.execute(
      user.idUsers,
      {
        idDebt: input.idDebt,
        title: input.title,
        description: input.description,
        idCategory: input.idCategory,
        debtType: input.debtType,
        acquiredAt: input.acquiredAt,
        dueDate: input.dueDate,
        totalAmount: input.totalAmount,
      },
    );

    return buildDataResponse(
      DebtResponseDto.fromView(updatedDebt),
      RESPONSE_MESSAGES.debts.detailsUpdated,
    );
  }

  @Mutation(() => CreateDebtMutationResponseDto, { name: "updateDebtStatus" })
  @RequirePageAccess(PageAccessKey.DEBTS)
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateDebtStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateDebtStatusInputDto,
  ) {
    const updatedDebt = await this.updateDebtStatusUseCase.execute(
      user.idUsers,
      {
        idDebt: input.idDebt,
        status: input.status,
      },
    );

    return buildDataResponse(
      DebtResponseDto.fromView(updatedDebt),
      RESPONSE_MESSAGES.debts.statusUpdated,
    );
  }

  @Mutation(() => DeleteDebtResponseDto, { name: "deleteDebt" })
  @RequirePageAccess(PageAccessKey.DEBTS)
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async deleteDebt(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idDebt") idDebt: string,
  ) {
    await this.deleteDebtUseCase.execute(user.idUsers, idDebt);

    return buildSuccessResponse(RESPONSE_MESSAGES.debts.deleted);
  }
}
