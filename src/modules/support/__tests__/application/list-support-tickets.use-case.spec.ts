import { ListSupportTicketsUseCase } from "@/modules/support/application/use-cases/list-support-tickets.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

function buildUseCase() {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const ticket = {
    idSupportMessage: "ticket-1",
    idUsers: "user-1",
    protocolNumber: 12,
    category: SupportCategory.DOUBT,
    message: "Preciso de ajuda",
    status: SupportTicketStatus.OPEN,
    createdAt: new Date("2026-08-13T12:00:00.000Z"),
  };

  const supportMessageRepository = {
    listTicketsPaginated: jest
      .fn()
      .mockResolvedValue({ records: [ticket], total: 1 }),
  };

  const userRepository = {
    find: jest
      .fn()
      .mockResolvedValue([
        { idUsers: "user-1", name: "Stanley", email: "stanley@example.com" },
      ]),
  };

  const useCase = new ListSupportTicketsUseCase(
    authorizationService as never,
    supportMessageRepository as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    supportMessageRepository,
    userRepository,
    ticket,
  };
}

describe("ListSupportTicketsUseCase", () => {
  it("checks the read-tickets permission and paginates with the given filters", async () => {
    const { useCase, authorizationService, supportMessageRepository } =
      buildUseCase();

    await useCase.execute("admin-1", {
      page: 2,
      limit: 5,
      status: SupportTicketStatus.OPEN,
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.READ_SUPPORT_TICKETS,
    );
    expect(supportMessageRepository.listTicketsPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      filters: { status: SupportTicketStatus.OPEN, category: undefined },
    });
  });

  it("attaches the requester's name and email to each ticket", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute("admin-1", {});

    expect(result.items).toEqual([
      expect.objectContaining({
        idSupportMessage: "ticket-1",
        userName: "Stanley",
        userEmail: "stanley@example.com",
      }),
    ]);
    expect(result.total).toBe(1);
  });

  it("attaches the finalizing admin's name for resolved tickets", async () => {
    const { useCase, supportMessageRepository, userRepository, ticket } =
      buildUseCase();
    supportMessageRepository.listTicketsPaginated.mockResolvedValueOnce({
      records: [
        {
          ...ticket,
          status: SupportTicketStatus.RESOLVED,
          finalizedByAdminId: "admin-1",
        },
      ],
      total: 1,
    });
    userRepository.find.mockResolvedValueOnce([
      { idUsers: "user-1", name: "Stanley", email: "stanley@example.com" },
      { idUsers: "admin-1", name: "Admin Master", email: "admin@example.com" },
    ]);

    const result = await useCase.execute("admin-1", {});

    expect(userRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idUsers: expect.anything() },
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({ finalizedByName: "Admin Master" }),
    );
  });
});
