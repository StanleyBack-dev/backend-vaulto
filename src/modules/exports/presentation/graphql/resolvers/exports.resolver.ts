import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ExportResourceUseCase } from "@/modules/exports/application/use-cases/export-resource.use-case";
import { ExportResourceInputDto } from "@/modules/exports/presentation/graphql/dtos/export-resource-input.dto";
import { ExportResourceResponseDto } from "@/modules/exports/presentation/graphql/dtos/export-resource-response.dto";
import "@/modules/exports/presentation/graphql/enums/exports-graphql.enums";

@Resolver()
export class ExportsResolver {
  constructor(private readonly exportResourceUseCase: ExportResourceUseCase) {}

  @Query(() => ExportResourceResponseDto, { name: "exportResource" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async exportResource(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ExportResourceInputDto,
  ) {
    const result = await this.exportResourceUseCase.execute(
      user.idUsers,
      user.username,
      {
        resource: input.resource,
        format: input.format,
        filters: {
          dueDateFrom: input.dueDateFrom,
          dueDateTo: input.dueDateTo,
          idDebt: input.idDebt,
          idIncome: input.idIncome,
          idFinancialGoal: input.idFinancialGoal,
          statementScope: input.statementScope,
          debtStatus: input.debtStatus,
          debtType: input.debtType,
          incomeStatus: input.incomeStatus,
          incomeType: input.incomeType,
          idCategory: input.idCategory,
          categoryType: input.categoryType,
          activeOnly: input.activeOnly,
        },
      },
    );

    return ExportResourceResponseDto.fromOutput(result);
  }
}
