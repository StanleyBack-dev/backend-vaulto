import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetDebtsReportUseCase } from "@/modules/reports/application/use-cases/get-debts-report.use-case";
import { GetDebtsReportInputDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-input.dto";
import { DebtsReportResponseDto } from "@/modules/reports/presentation/graphql/dtos/get-debts-report-response.dto";

@Resolver()
export class ReportsResolver {
  constructor(private readonly getDebtsReportUseCase: GetDebtsReportUseCase) {}

  @Query(() => DebtsReportResponseDto, { name: "getDebtsReport" })
  @RequirePermissions(AuthPermission.READ_OWN_DEBTS)
  async getDebtsReport(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: GetDebtsReportInputDto,
  ) {
    const result = await this.getDebtsReportUseCase.execute(user.idUsers, {
      dueDateFrom: input?.dueDateFrom,
      dueDateTo: input?.dueDateTo,
      debtType: input?.debtType,
      idCategory: input?.idCategory,
    });

    return DebtsReportResponseDto.fromView(result);
  }
}
