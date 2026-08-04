import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  REPORT_REPOSITORY,
  type DebtsReportFilters,
  type DebtsReportView,
  type ReportRepositoryPort,
} from "@/modules/reports/application/ports/report-repository.port";

@Injectable()
export class GetDebtsReportUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepositoryPort,
  ) {}

  async execute(
    userId: string,
    filters?: DebtsReportFilters,
  ): Promise<DebtsReportView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_DEBTS,
    );

    return this.reportRepository.getDebtsReport(userId, filters);
  }
}
