import { GetAdminReferralLeaderboardUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-leaderboard.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const rows = [
    {
      idUsers: "user-1",
      name: "Messi",
      email: "messi@example.com",
      qualifiedReferralsCount: 20,
      totalCreditsGrantedCents: 10000,
      availableBalanceCents: 4000,
    },
  ];

  const adminRepository = {
    getReferralLeaderboard: jest.fn().mockResolvedValue(rows),
  };

  const useCase = new GetAdminReferralLeaderboardUseCase(
    authorizationService as never,
    adminRepository as never,
  );

  return { useCase, authorizationService, adminRepository, rows };
}

describe("GetAdminReferralLeaderboardUseCase", () => {
  it("checks the admin-dashboard permission before returning the leaderboard", async () => {
    const { useCase, authorizationService, rows } = buildUseCase();

    const result = await useCase.execute("admin-1");

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.READ_ADMIN_DASHBOARD,
    );
    expect(result).toBe(rows);
  });

  it("propagates the authorization failure without querying the leaderboard", async () => {
    const { useCase, authorizationService, adminRepository } = buildUseCase();
    authorizationService.assertPermissionForUserId.mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(useCase.execute("user-1")).rejects.toThrow("forbidden");
    expect(adminRepository.getReferralLeaderboard).not.toHaveBeenCalled();
  });
});
