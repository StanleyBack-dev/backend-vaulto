import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  ADMIN_REPOSITORY,
  type AdminRepositoryPort,
  type AdminReferralMonthlyPoint,
} from "@/modules/admin/application/ports/admin-repository.port";

export interface GetAdminReferralTrendInput {
  dateFrom: Date;
  dateTo: Date;
}

@Injectable()
export class GetAdminReferralTrendUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: AdminRepositoryPort,
  ) {}

  async execute(
    idUsers: string,
    input: GetAdminReferralTrendInput,
  ): Promise<AdminReferralMonthlyPoint[]> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.READ_ADMIN_DASHBOARD,
    );

    return this.adminRepository.getReferralMonthlyTrend(
      input.dateFrom,
      input.dateTo,
    );
  }
}
