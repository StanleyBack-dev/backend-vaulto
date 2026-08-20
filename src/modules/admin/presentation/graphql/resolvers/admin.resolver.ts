import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetAdminDashboardStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-dashboard-stats.use-case";
import { GetAdminReferralLeaderboardUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-leaderboard.use-case";
import { GetAdminReferralStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-stats.use-case";
import { GetAdminReferralTrendUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-trend.use-case";
import { AdminDashboardStatsResponseDto } from "@/modules/admin/presentation/graphql/dtos/admin-dashboard-stats-response.dto";
import { AdminReferralLeaderboardRowDto } from "@/modules/admin/presentation/graphql/dtos/admin-referral-leaderboard-row.dto";
import { AdminReferralMonthlyPointDto } from "@/modules/admin/presentation/graphql/dtos/admin-referral-monthly-point.dto";
import { AdminReferralStatsResponseDto } from "@/modules/admin/presentation/graphql/dtos/admin-referral-stats-response.dto";
import { AdminReferralTrendInputDto } from "@/modules/admin/presentation/graphql/dtos/admin-referral-trend-input.dto";

@Resolver()
@RequirePageAccess(PageAccessKey.ADMIN)
export class AdminResolver {
  constructor(
    private readonly getAdminDashboardStatsUseCase: GetAdminDashboardStatsUseCase,
    private readonly getAdminReferralStatsUseCase: GetAdminReferralStatsUseCase,
    private readonly getAdminReferralTrendUseCase: GetAdminReferralTrendUseCase,
    private readonly getAdminReferralLeaderboardUseCase: GetAdminReferralLeaderboardUseCase,
  ) {}

  @Query(() => AdminDashboardStatsResponseDto, { name: "adminDashboardStats" })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    const stats = await this.getAdminDashboardStatsUseCase.execute(
      user.idUsers,
    );

    return AdminDashboardStatsResponseDto.fromView(stats);
  }

  @Query(() => AdminReferralStatsResponseDto, { name: "adminReferralStats" })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminReferralStats(@CurrentUser() user: AuthenticatedUser) {
    const stats = await this.getAdminReferralStatsUseCase.execute(user.idUsers);

    return AdminReferralStatsResponseDto.fromView(stats);
  }

  @Query(() => [AdminReferralMonthlyPointDto], {
    name: "adminReferralTrend",
  })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminReferralTrend(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AdminReferralTrendInputDto,
  ) {
    const points = await this.getAdminReferralTrendUseCase.execute(
      user.idUsers,
      { dateFrom: input.dateFrom, dateTo: input.dateTo },
    );

    return points.map(AdminReferralMonthlyPointDto.fromView);
  }

  @Query(() => [AdminReferralLeaderboardRowDto], {
    name: "adminReferralLeaderboard",
  })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminReferralLeaderboard(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.getAdminReferralLeaderboardUseCase.execute(
      user.idUsers,
    );

    return rows.map(AdminReferralLeaderboardRowDto.fromView);
  }
}
