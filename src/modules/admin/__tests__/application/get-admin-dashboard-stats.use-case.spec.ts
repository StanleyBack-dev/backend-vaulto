import { GetAdminDashboardStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-dashboard-stats.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const statsView = {
    totalUsers: 42,
    usersByGroup: [],
    totalSubscriptions: 10,
    freeSubscriptions: 7,
    activeProSubscriptions: 3,
    subscriptionsByStatus: [],
    estimatedMonthlyRecurringRevenue: 44.7,
    totalSupportTickets: 5,
    openSupportTickets: 2,
    resolvedSupportTickets: 3,
  };

  const adminRepository = {
    getDashboardStats: jest.fn().mockResolvedValue(statsView),
  };

  const useCase = new GetAdminDashboardStatsUseCase(
    authorizationService as never,
    adminRepository as never,
  );

  return { useCase, authorizationService, adminRepository, statsView };
}

describe("GetAdminDashboardStatsUseCase", () => {
  it("checks the admin-dashboard permission before returning stats", async () => {
    const { useCase, authorizationService, statsView } = buildUseCase();

    const result = await useCase.execute("admin-1");

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.READ_ADMIN_DASHBOARD,
    );
    expect(result).toEqual(statsView);
  });

  it("propagates the authorization failure without querying stats", async () => {
    const { useCase, authorizationService, adminRepository } = buildUseCase();
    authorizationService.assertPermissionForUserId.mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(useCase.execute("user-1")).rejects.toThrow("forbidden");
    expect(adminRepository.getDashboardStats).not.toHaveBeenCalled();
  });
});
