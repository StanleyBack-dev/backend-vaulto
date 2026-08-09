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
import { CreateFinancialGoalUseCase } from "@/modules/goals/application/use-cases/create/create-financial-goal.use-case";
import { DeleteFinancialGoalUseCase } from "@/modules/goals/application/use-cases/delete/delete-financial-goal.use-case";
import { GetFinancialGoalByIdUseCase } from "@/modules/goals/application/use-cases/get/get-financial-goal-by-id.use-case";
import { ListFinancialGoalsUseCase } from "@/modules/goals/application/use-cases/get/list-financial-goals.use-case";
import { UpdateFinancialGoalUseCase } from "@/modules/goals/application/use-cases/update/update-financial-goal.use-case";
import { RegisterGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/register-goal-contribution.use-case";
import { UpdateGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/update-goal-contribution.use-case";
import { DeleteGoalContributionUseCase } from "@/modules/goals/application/use-cases/contribution/delete-goal-contribution.use-case";
import { CreateFinancialGoalInputDto } from "@/modules/goals/presentation/graphql/dtos/create/create-financial-goal-input.dto";
import { CreateFinancialGoalMutationResponseDto } from "@/modules/goals/presentation/graphql/dtos/create/create-financial-goal-mutation-response.dto";
import { DeleteFinancialGoalResponseDto } from "@/modules/goals/presentation/graphql/dtos/delete/delete-financial-goal-response.dto";
import { FinancialGoalResponseDto } from "@/modules/goals/presentation/graphql/dtos/get/financial-goal-response.dto";
import { GetFinancialGoalByIdInputDto } from "@/modules/goals/presentation/graphql/dtos/get/get-financial-goal-by-id-input.dto";
import { ListFinancialGoalsInputDto } from "@/modules/goals/presentation/graphql/dtos/get/list-financial-goals-input.dto";
import { ListFinancialGoalsResponseDto } from "@/modules/goals/presentation/graphql/dtos/get/list-financial-goals-response.dto";
import { UpdateFinancialGoalInputDto } from "@/modules/goals/presentation/graphql/dtos/update/update-financial-goal-input.dto";
import { RegisterGoalContributionInputDto } from "@/modules/goals/presentation/graphql/dtos/contribution/register-goal-contribution-input.dto";
import { UpdateGoalContributionInputDto } from "@/modules/goals/presentation/graphql/dtos/contribution/update-goal-contribution-input.dto";
import "@/modules/goals/presentation/graphql/enums/goals-graphql.enums";

@Resolver()
export class FinancialGoalsResolver {
  constructor(
    private readonly createFinancialGoalUseCase: CreateFinancialGoalUseCase,
    private readonly getFinancialGoalByIdUseCase: GetFinancialGoalByIdUseCase,
    private readonly listFinancialGoalsUseCase: ListFinancialGoalsUseCase,
    private readonly updateFinancialGoalUseCase: UpdateFinancialGoalUseCase,
    private readonly deleteFinancialGoalUseCase: DeleteFinancialGoalUseCase,
    private readonly registerGoalContributionUseCase: RegisterGoalContributionUseCase,
    private readonly updateGoalContributionUseCase: UpdateGoalContributionUseCase,
    private readonly deleteGoalContributionUseCase: DeleteGoalContributionUseCase,
  ) {}

  @Query(() => FinancialGoalResponseDto, { name: "getFinancialGoalById" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getFinancialGoalById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetFinancialGoalByIdInputDto,
  ) {
    const goal = await this.getFinancialGoalByIdUseCase.execute(
      user.idUsers,
      input.idFinancialGoal,
    );

    return FinancialGoalResponseDto.fromView(goal);
  }

  @Query(() => ListFinancialGoalsResponseDto, { name: "getMyFinancialGoals" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getMyFinancialGoals(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListFinancialGoalsInputDto,
  ) {
    const result = await this.listFinancialGoalsUseCase.execute(
      user.idUsers,
      input,
    );

    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) =>
          FinancialGoalResponseDto.fromView(item),
        ),
      },
      RESPONSE_MESSAGES.goals.listed,
    );
  }

  @Mutation(() => CreateFinancialGoalMutationResponseDto, {
    name: "createFinancialGoal",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async createFinancialGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateFinancialGoalInputDto,
  ) {
    const createdGoal = await this.createFinancialGoalUseCase.execute(
      user.idUsers,
      {
        title: input.title,
        description: input.description,
        targetAmount: input.targetAmount,
        targetDate: input.targetDate,
      },
    );

    return buildDataResponse(
      FinancialGoalResponseDto.fromView(createdGoal),
      RESPONSE_MESSAGES.goals.created,
    );
  }

  @Mutation(() => CreateFinancialGoalMutationResponseDto, {
    name: "updateFinancialGoal",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateFinancialGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateFinancialGoalInputDto,
  ) {
    const updatedGoal = await this.updateFinancialGoalUseCase.execute(
      user.idUsers,
      {
        idFinancialGoal: input.idFinancialGoal,
        title: input.title,
        description: input.description,
        targetAmount: input.targetAmount,
        targetDate: input.targetDate,
      },
    );

    return buildDataResponse(
      FinancialGoalResponseDto.fromView(updatedGoal),
      RESPONSE_MESSAGES.goals.updated,
    );
  }

  @Mutation(() => DeleteFinancialGoalResponseDto, {
    name: "deleteFinancialGoal",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async deleteFinancialGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idFinancialGoal") idFinancialGoal: string,
  ) {
    await this.deleteFinancialGoalUseCase.execute(
      user.idUsers,
      idFinancialGoal,
    );

    return buildSuccessResponse(RESPONSE_MESSAGES.goals.deleted);
  }

  @Mutation(() => CreateFinancialGoalMutationResponseDto, {
    name: "registerGoalContribution",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async registerGoalContribution(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RegisterGoalContributionInputDto,
  ) {
    const updatedGoal = await this.registerGoalContributionUseCase.execute(
      user.idUsers,
      {
        idFinancialGoal: input.idFinancialGoal,
        amount: input.amount,
        contributedAt: input.contributedAt,
        note: input.note,
      },
    );

    return buildDataResponse(
      FinancialGoalResponseDto.fromView(updatedGoal),
      RESPONSE_MESSAGES.goals.contributionRegistered,
    );
  }

  @Mutation(() => CreateFinancialGoalMutationResponseDto, {
    name: "updateGoalContribution",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async updateGoalContribution(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateGoalContributionInputDto,
  ) {
    const updatedGoal = await this.updateGoalContributionUseCase.execute(
      user.idUsers,
      {
        idFinancialGoal: input.idFinancialGoal,
        idGoalContribution: input.idGoalContribution,
        amount: input.amount,
        contributedAt: input.contributedAt,
        note: input.note,
      },
    );

    return buildDataResponse(
      FinancialGoalResponseDto.fromView(updatedGoal),
      RESPONSE_MESSAGES.goals.contributionUpdated,
    );
  }

  @Mutation(() => CreateFinancialGoalMutationResponseDto, {
    name: "deleteGoalContribution",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_DEBTS)
  async deleteGoalContribution(
    @CurrentUser() user: AuthenticatedUser,
    @Args("idFinancialGoal") idFinancialGoal: string,
    @Args("idGoalContribution") idGoalContribution: string,
  ) {
    const updatedGoal = await this.deleteGoalContributionUseCase.execute(
      user.idUsers,
      idFinancialGoal,
      idGoalContribution,
    );

    return buildDataResponse(
      FinancialGoalResponseDto.fromView(updatedGoal),
      RESPONSE_MESSAGES.goals.contributionDeleted,
    );
  }
}
