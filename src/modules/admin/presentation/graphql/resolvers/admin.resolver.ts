import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildPaginatedListResponse } from "@/common/responses/helpers/response.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import { RequirePageAccess } from "@/modules/auth/presentation/decorators/require-page-access.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetAdminDashboardStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-dashboard-stats.use-case";
import { GetAdminProLeadStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-pro-lead-stats.use-case";
import { GetAdminProLeadsUseCase } from "@/modules/admin/application/use-cases/get-admin-pro-leads.use-case";
import { GetAdminReferralLeaderboardUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-leaderboard.use-case";
import { GetAdminReferralStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-stats.use-case";
import { GetAdminReferralTrendUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-trend.use-case";
import { AdminDashboardStatsResponseDto } from "@/modules/admin/presentation/graphql/dtos/admin-dashboard-stats-response.dto";
import { AdminProLeadRowDto } from "@/modules/admin/presentation/graphql/dtos/admin-pro-lead-row.dto";
import { AdminProLeadStatsResponseDto } from "@/modules/admin/presentation/graphql/dtos/admin-pro-lead-stats-response.dto";
import { AdminProLeadsInputDto } from "@/modules/admin/presentation/graphql/dtos/admin-pro-leads-input.dto";
import { AdminProLeadsListResponseDto } from "@/modules/admin/presentation/graphql/dtos/admin-pro-leads-list-response.dto";
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
    private readonly getAdminProLeadStatsUseCase: GetAdminProLeadStatsUseCase,
    private readonly getAdminProLeadsUseCase: GetAdminProLeadsUseCase,
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

  @Query(() => AdminProLeadStatsResponseDto, { name: "adminProLeadStats" })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminProLeadStats(@CurrentUser() user: AuthenticatedUser) {
    const stats = await this.getAdminProLeadStatsUseCase.execute(user.idUsers);

    return AdminProLeadStatsResponseDto.fromView(stats);
  }

  @Query(() => AdminProLeadsListResponseDto, { name: "adminProLeads" })
  @RequirePermissions(AuthPermission.READ_ADMIN_DASHBOARD)
  async adminProLeads(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: AdminProLeadsInputDto,
  ) {
    const result = await this.getAdminProLeadsUseCase.execute(user.idUsers, {
      page: input?.page,
      limit: input?.limit,
      eventType: input?.eventType,
    });

    return buildPaginatedListResponse(
      { ...result, items: result.items.map(AdminProLeadRowDto.fromView) },
      RESPONSE_MESSAGES.admin.proLeadsListed,
    );
  }
}
