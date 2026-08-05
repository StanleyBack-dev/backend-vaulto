import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
  buildSuccessResponse,
} from "@/common/responses/helpers/response.helper";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateIncomeUseCase } from "@/modules/incomes/application/use-cases/create/create-income.use-case";
import { DeleteIncomeUseCase } from "@/modules/incomes/application/use-cases/delete/delete-income.use-case";
import { GetIncomeByIdUseCase } from "@/modules/incomes/application/use-cases/get/get-income-by-id.use-case";
import { ListIncomesUseCase } from "@/modules/incomes/application/use-cases/get/list-incomes.use-case";
import { UpdateIncomeDetailsUseCase } from "@/modules/incomes/application/use-cases/update/update-income-details.use-case";
import { UpdateIncomeStatusUseCase } from "@/modules/incomes/application/use-cases/update/update-income-status.use-case";
import { CreateIncomeInputDto } from "@/modules/incomes/presentation/graphql/dtos/create/create-income-input.dto";
import { CreateIncomeMutationResponseDto } from "@/modules/incomes/presentation/graphql/dtos/create/create-income-mutation-response.dto";
import { DeleteIncomeResponseDto } from "@/modules/incomes/presentation/graphql/dtos/delete/delete-income-response.dto";
import { GetIncomeByIdInputDto } from "@/modules/incomes/presentation/graphql/dtos/get/get-income-by-id-input.dto";
import { IncomeResponseDto } from "@/modules/incomes/presentation/graphql/dtos/get/income-response.dto";
import { ListIncomesInputDto } from "@/modules/incomes/presentation/graphql/dtos/get/list-incomes-input.dto";
import { ListIncomesResponseDto } from "@/modules/incomes/presentation/graphql/dtos/get/list-incomes-response.dto";
import { UpdateIncomeDetailsInputDto } from "@/modules/incomes/presentation/graphql/dtos/update/update-income-details-input.dto";
import { UpdateIncomeStatusInputDto } from "@/modules/incomes/presentation/graphql/dtos/update/update-income-status-input.dto";

@Resolver()
export class IncomesResolver {
  constructor(
    private readonly createIncomeUseCase: CreateIncomeUseCase,
    private readonly getIncomeByIdUseCase: GetIncomeByIdUseCase,
    private readonly listIncomesUseCase: ListIncomesUseCase,
    private readonly updateIncomeDetailsUseCase: UpdateIncomeDetailsUseCase,
    private readonly updateIncomeStatusUseCase: UpdateIncomeStatusUseCase,
    private readonly deleteIncomeUseCase: DeleteIncomeUseCase,
  ) {}

  @Query(() => IncomeResponseDto, { name: "getIncomeById" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getIncomeById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetIncomeByIdInputDto,
  ) {
    const income = await this.getIncomeByIdUseCase.execute(user.idUsers, {
      idIncome: input.idIncome,
    });

    return IncomeResponseDto.fromView(income);
  }

  @Mutation(() => CreateIncomeMutationResponseDto, { name: "createIncome" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async createIncome(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateIncomeInputDto,
  ) {
    const createdIncome = await this.createIncomeUseCase.execute(
      user.idUsers,
      {
        title: input.title,
        idCategory: input.idCategory,
        description: input.description,
        incomeType: input.incomeType,
        totalAmount: input.totalAmount,
        dueDate: input.dueDate,
        hasInstallments: input.hasInstallments,
        installmentCount: input.installmentCount,
        installmentAmount: input.installmentAmount,
        isRecurring: input.isRecurring,
      },
    );

    return buildDataResponse(
      IncomeResponseDto.fromView(createdIncome),
      RESPONSE_MESSAGES.incomes.created,
    );
  }

  @Query(() => ListIncomesResponseDto, { name: "getMyIncomes" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyIncomes(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListIncomesInputDto,
  ) {
    const result = await this.listIncomesUseCase.execute(user.idUsers, input);

    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => IncomeResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.incomes.listed,
    );
  }

  @Mutation(() => CreateIncomeMutationResponseDto, {
    name: "updateIncomeDetails",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateIncomeDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateIncomeDetailsInputDto,
  ) {
    const updatedIncome = await this.updateIncomeDetailsUseCase.execute(
      user.idUsers,
      {
        idIncome: input.idIncome,
        title: input.title,
        description: input.description,
        idCategory: input.idCategory,
        incomeType: input.incomeType,
        dueDate: input.dueDate,
        totalAmount: input.totalAmount,
        isRecurring: input.isRecurring,
      },
    );

    return buildDataResponse(
      IncomeResponseDto.fromView(updatedIncome),
      RESPONSE_MESSAGES.incomes.detailsUpdated,
    );
  }

  @Mutation(() => CreateIncomeMutationResponseDto, {
    name: "updateIncomeStatus",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateIncomeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateIncomeStatusInputDto,
  ) {
    const updatedIncome = await this.updateIncomeStatusUseCase.execute(
      user.idUsers,
      {
        idIncome: input.idIncome,
        status: input.status,
      },
    );

    return buildDataResponse(
      IncomeResponseDto.fromView(updatedIncome),
      RESPONSE_MESSAGES.incomes.statusUpdated,
    );
  }

  @Mutation(() => DeleteIncomeResponseDto, { name: "deleteIncome" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async deleteIncome(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idIncome") idIncome: string,
  ) {
    await this.deleteIncomeUseCase.execute(user.idUsers, idIncome);

    return buildSuccessResponse(RESPONSE_MESSAGES.incomes.deleted);
  }
}
