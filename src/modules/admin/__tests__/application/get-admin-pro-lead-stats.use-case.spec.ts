import { GetAdminProLeadStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-pro-lead-stats.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const statsView = {
    totalPlanClicks: 40,
    totalCheckoutReached: 12,
    uniqueUsersClicked: 35,
    uniqueUsersReachedCheckout: 10,
    convertedToProCount: 6,
  };

  const adminRepository = {
    getProLeadStats: jest.fn().mockResolvedValue(statsView),
  };

  const useCase = new GetAdminProLeadStatsUseCase(
    authorizationService as never,
    adminRepository as never,
  );

  return { useCase, authorizationService, adminRepository, statsView };
}

describe("GetAdminProLeadStatsUseCase", () => {
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
    expect(adminRepository.getProLeadStats).not.toHaveBeenCalled();
  });
});
