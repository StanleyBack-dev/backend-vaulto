import { Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetAdminDashboardStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-dashboard-stats.use-case";
import { AdminDashboardStatsResponseDto } from "@/modules/admin/presentation/graphql/dtos/admin-dashboard-stats-response.dto";

@Resolver()
@RequirePageAccess(PageAccessKey.ADMIN)
export class AdminResolver {
  constructor(
    private readonly getAdminDashboardStatsUseCase: GetAdminDashboardStatsUseCase,
  ) {}

  @Query(() => AdminDashboardStatsResponseDto, { name: "adminDashboardStats" })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    const stats = await this.getAdminDashboardStatsUseCase.execute(
      user.idUsers,
    );

    return AdminDashboardStatsResponseDto.fromView(stats);
  }
}
