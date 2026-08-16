import { AppException } from "@/common/exceptions/app-exception";
import { GetSupportTicketUseCase } from "@/modules/support/application/use-cases/get-support-ticket.use-case";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";
import { SupportTicketStatus } from "@/modules/support/domain/enums/support-ticket-status.enum";

function buildUseCase(overrides: { ticket?: unknown } = {}) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const ticket = overrides.ticket ?? {
    idSupportMessage: "ticket-1",
    idUsers: "user-1",
    protocolNumber: 12,
    category: SupportCategory.DOUBT,
    message: "Preciso de ajuda",
    status: SupportTicketStatus.OPEN,
    createdAt: new Date("2026-08-13T12:00:00.000Z"),
  };

  const supportMessageRepository = {
    findTicketById: jest.fn().mockResolvedValue(ticket),
  };

  const usersById: Record<string, { name: string; email: string }> = {
    "user-1": { name: "Stanley", email: "stanley@example.com" },
    "admin-1": { name: "Admin Master", email: "admin@example.com" },
  };

  const userRepository = {
    findOne: jest
      .fn()
      .mockImplementation(({ where: { idUsers } }) =>
        Promise.resolve(usersById[idUsers] ?? null),
      ),
  };

  const useCase = new GetSupportTicketUseCase(
    authorizationService as never,
    supportMessageRepository as never,
    userRepository as never,
  );

  return { useCase, authorizationService, supportMessageRepository };
}

describe("GetSupportTicketUseCase", () => {
  it("checks the read-tickets permission and returns the ticket with requester info", async () => {
    const { useCase, authorizationService } = buildUseCase();

    const result = await useCase.execute("admin-1", "ticket-1");

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.READ_SUPPORT_TICKETS,
    );
    expect(result).toMatchObject({
      idSupportMessage: "ticket-1",
      userName: "Stanley",
      userEmail: "stanley@example.com",
    });
    expect(result.finalizedByName).toBeUndefined();
  });

  it("throws when the ticket does not exist", async () => {
    const { useCase, supportMessageRepository } = buildUseCase();
    supportMessageRepository.findTicketById.mockResolvedValueOnce(null);

    await expect(useCase.execute("admin-1", "missing")).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it("attaches the finalizing admin's name for a resolved ticket", async () => {
    const { useCase } = buildUseCase({
      ticket: {
        idSupportMessage: "ticket-1",
        idUsers: "user-1",
        protocolNumber: 12,
        category: SupportCategory.DOUBT,
        message: "Preciso de ajuda",
        status: SupportTicketStatus.RESOLVED,
        finalizedByAdminId: "admin-1",
        createdAt: new Date("2026-08-13T12:00:00.000Z"),
      },
    });

    const result = await useCase.execute("admin-1", "ticket-1");

    expect(result.finalizedByName).toBe("Admin Master");
  });
});
