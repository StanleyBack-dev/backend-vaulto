import { GetAdminReferralStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-stats.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const statsView = {
    totalReferredUsers: 20,
    totalQualifiedReferrals: 14,
    creditAmountCents: 500,
    totalCreditsGrantedCents: 7000,
    totalClawedBackCents: 500,
    totalWithdrawnCents: 2000,
    totalPendingWithdrawalCents: 6000,
    totalFailedWithdrawalCents: 2000,
    totalOutstandingLiabilityCents: 3000,
  };

  const adminRepository = {
    getReferralStats: jest.fn().mockResolvedValue(statsView),
  };

  const useCase = new GetAdminReferralStatsUseCase(
    authorizationService as never,
    adminRepository as never,
  );

  return { useCase, authorizationService, adminRepository, statsView };
}

describe("GetAdminReferralStatsUseCase", () => {
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
    expect(adminRepository.getReferralStats).not.toHaveBeenCalled();
  });
});
