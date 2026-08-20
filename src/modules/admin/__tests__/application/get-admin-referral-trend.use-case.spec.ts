import { GetAdminReferralTrendUseCase } from "@/modules/admin/application/use-cases/get-admin-referral-trend.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const points = [
    { month: "2026-07", qualifiedReferrals: 3, creditsGrantedCents: 1500 },
    { month: "2026-08", qualifiedReferrals: 5, creditsGrantedCents: 2500 },
  ];

  const adminRepository = {
    getReferralMonthlyTrend: jest.fn().mockResolvedValue(points),
  };

  const useCase = new GetAdminReferralTrendUseCase(
    authorizationService as never,
    adminRepository as never,
  );

  return { useCase, authorizationService, adminRepository, points };
}

describe("GetAdminReferralTrendUseCase", () => {
  it("checks the admin-dashboard permission and forwards the date range", async () => {
    const { useCase, authorizationService, adminRepository, points } =
      buildUseCase();
    const dateFrom = new Date("2026-07-01");
    const dateTo = new Date("2026-08-31");

    const result = await useCase.execute("admin-1", { dateFrom, dateTo });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.READ_ADMIN_DASHBOARD,
    );
    expect(adminRepository.getReferralMonthlyTrend).toHaveBeenCalledWith(
      dateFrom,
      dateTo,
    );
    expect(result).toBe(points);
  });

  it("propagates the authorization failure without querying the trend", async () => {
    const { useCase, authorizationService, adminRepository } = buildUseCase();
    authorizationService.assertPermissionForUserId.mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(
      useCase.execute("user-1", {
        dateFrom: new Date("2026-07-01"),
        dateTo: new Date("2026-08-31"),
      }),
    ).rejects.toThrow("forbidden");
    expect(adminRepository.getReferralMonthlyTrend).not.toHaveBeenCalled();
  });
});
