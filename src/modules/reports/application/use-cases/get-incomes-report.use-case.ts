import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { PlanLimitsService } from "@/modules/billing/application/use-cases/plan-limits.use-case";
import {
  REPORT_REPOSITORY,
  type IncomesReportFilters,
  type IncomesReportView,
  type ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";

@Injectable()
export class GetIncomesReportUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly planLimitsService: PlanLimitsService,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepositoryPort,
  ) {}

  async execute(
    userId: string,
    filters?: IncomesReportFilters,
  ): Promise<IncomesReportView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );
    await this.planLimitsService.assertProPlan(userId);

    return this.reportRepository.getIncomesReport(userId, filters);
  }
}
