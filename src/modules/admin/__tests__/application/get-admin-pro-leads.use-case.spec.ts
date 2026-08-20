import { GetAdminProLeadsUseCase } from "@/modules/admin/application/use-cases/get-admin-pro-leads.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const listResult = {
    items: [],
    total: 0,
    currentPage: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
  };

  const adminRepository = {
    listProLeads: jest.fn().mockResolvedValue(listResult),
  };

  const useCase = new GetAdminProLeadsUseCase(
    authorizationService as never,
    adminRepository as never,
  );

  return { useCase, authorizationService, adminRepository, listResult };
}

describe("GetAdminProLeadsUseCase", () => {
  it("checks the admin-dashboard permission and forwards the filter", async () => {
    const { useCase, authorizationService, adminRepository, listResult } =
      buildUseCase();

    const result = await useCase.execute("admin-1", {
      page: 2,
      limit: 20,
      eventType: undefined,
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.READ_ADMIN_DASHBOARD,
    );
    expect(adminRepository.listProLeads).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      eventType: undefined,
    });
    expect(result).toEqual(listResult);
  });

  it("propagates the authorization failure without listing leads", async () => {
    const { useCase, authorizationService, adminRepository } = buildUseCase();
    authorizationService.assertPermissionForUserId.mockRejectedValueOnce(
      new Error("forbidden"),
    );

    await expect(useCase.execute("user-1", {})).rejects.toThrow("forbidden");
    expect(adminRepository.listProLeads).not.toHaveBeenCalled();
  });
});
