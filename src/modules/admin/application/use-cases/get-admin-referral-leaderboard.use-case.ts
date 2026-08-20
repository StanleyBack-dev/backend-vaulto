import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  ADMIN_REPOSITORY,
  type AdminRepositoryPort,
  type AdminReferralLeaderboardRow,
} from "@/modules/admin/application/ports/admin-repository.port";

@Injectable()
export class GetAdminReferralLeaderboardUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: AdminRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<AdminReferralLeaderboardRow[]> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.READ_ADMIN_DASHBOARD,
    );

    return this.adminRepository.getReferralLeaderboard();
  }
}
