import { AppException } from "@/common/exceptions/app-exception";
import { ReplyToSupportTicketUseCase } from "@/modules/support/application/use-cases/reply-to-support-ticket.use-case";
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

  const repliedTicket = {
    ...ticket,
    status: SupportTicketStatus.ANSWERED,
    adminReply: "Aqui está a resposta",
    repliedAt: new Date("2026-08-13T13:00:00.000Z"),
    repliedByAdminId: "admin-1",
  };

  const supportMessageRepository = {
    findTicketById: jest.fn().mockResolvedValue(ticket),
    reply: jest.fn().mockResolvedValue(repliedTicket),
  };

  const supportTicketReplyEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOne: jest
      .fn()
      .mockResolvedValue({ name: "Stanley", email: "stanley@example.com" }),
  };

  const useCase = new ReplyToSupportTicketUseCase(
    authorizationService as never,
    supportMessageRepository as never,
    supportTicketReplyEmailUseCase as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    supportMessageRepository,
    supportTicketReplyEmailUseCase,
    userRepository,
  };
}

describe("ReplyToSupportTicketUseCase", () => {
  it("checks the manage-tickets permission before replying", async () => {
    const { useCase, authorizationService } = buildUseCase();

    await useCase.execute("admin-1", {
      idSupportMessage: "ticket-1",
      reply: "Aqui está a resposta",
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.MANAGE_SUPPORT_TICKETS,
    );
  });

  it("rejects an empty reply", async () => {
    const { useCase, supportMessageRepository } = buildUseCase();

    await expect(
      useCase.execute("admin-1", {
        idSupportMessage: "ticket-1",
        reply: "   ",
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(supportMessageRepository.reply).not.toHaveBeenCalled();
  });

  it("throws when the ticket does not exist", async () => {
    const { useCase, supportMessageRepository } = buildUseCase();
    supportMessageRepository.findTicketById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute("admin-1", { idSupportMessage: "missing", reply: "Oi" }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("persists the reply and emails the requester with the ticket's protocol and category", async () => {
    const {
      useCase,
      supportMessageRepository,
      supportTicketReplyEmailUseCase,
    } = buildUseCase();

    const result = await useCase.execute("admin-1", {
      idSupportMessage: "ticket-1",
      reply: "  Aqui está a resposta  ",
    });

    expect(supportMessageRepository.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        idSupportMessage: "ticket-1",
        adminReply: "Aqui está a resposta",
        repliedByAdminId: "admin-1",
      }),
    );
    expect(supportTicketReplyEmailUseCase.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "stanley@example.com",
        name: "Stanley",
        protocolNumber: 12,
        category: SupportCategory.DOUBT,
        originalMessage: "Preciso de ajuda",
        reply: "Aqui está a resposta",
      }),
    );
    expect(result.status).toBe(SupportTicketStatus.ANSWERED);
  });
});
