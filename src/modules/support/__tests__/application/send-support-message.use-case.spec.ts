import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { SendSupportMessageUseCase } from "@/modules/support/application/use-cases/send-support-message.use-case";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

function buildUseCase(overrides: { hasMessageSince?: boolean } = {}) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const supportMessageRepository = {
    hasMessageSince: jest
      .fn()
      .mockResolvedValue(overrides.hasMessageSince ?? false),
    create: jest.fn().mockImplementation((payload) =>
      Promise.resolve({
        category: payload.category,
        message: payload.message,
        createdAt: payload.createdAt,
      }),
    ),
  };

  const supportMessageNotificationEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const supportMessageConfirmationEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOne: jest
      .fn()
      .mockResolvedValue({ name: "Stanley", email: "stanley@example.com" }),
  };

  const useCase = new SendSupportMessageUseCase(
    authorizationService as never,
    supportMessageRepository as never,
    supportMessageNotificationEmailUseCase as never,
    supportMessageConfirmationEmailUseCase as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    supportMessageRepository,
    supportMessageNotificationEmailUseCase,
    supportMessageConfirmationEmailUseCase,
    userRepository,
  };
}

describe("SendSupportMessageUseCase", () => {
  it("rejects when the message is empty", async () => {
    const { useCase, supportMessageRepository } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        category: SupportCategory.DOUBT,
        message: "   ",
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(supportMessageRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when the user already sent a message today", async () => {
    const { useCase, supportMessageRepository } = buildUseCase({
      hasMessageSince: true,
    });

    await expect(
      useCase.execute("user-1", {
        category: SupportCategory.DOUBT,
        message: "Preciso de ajuda",
      }),
    ).rejects.toBeInstanceOf(AppException);
    expect(supportMessageRepository.create).not.toHaveBeenCalled();
  });

  it("persists the message and notifies both the company and the user", async () => {
    const {
      useCase,
      authorizationService,
      supportMessageRepository,
      supportMessageNotificationEmailUseCase,
      supportMessageConfirmationEmailUseCase,
    } = buildUseCase();

    const result = await useCase.execute("user-1", {
      category: SupportCategory.TECHNICAL_ISSUE,
      message: "O app travou ao salvar uma dívida.",
    });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "user-1",
      AuthPermission.MANAGE_OWN_PROFILE,
    );
    expect(supportMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        category: SupportCategory.TECHNICAL_ISSUE,
        message: "O app travou ao salvar uma dívida.",
      }),
    );
    expect(supportMessageNotificationEmailUseCase.send).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: "Stanley",
        userEmail: "stanley@example.com",
        category: SupportCategory.TECHNICAL_ISSUE,
      }),
    );
    expect(supportMessageConfirmationEmailUseCase.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "stanley@example.com",
        name: "Stanley",
        category: SupportCategory.TECHNICAL_ISSUE,
      }),
    );
    expect(result.category).toBe(SupportCategory.TECHNICAL_ISSUE);
  });

  it("trims the message before persisting it", async () => {
    const { useCase, supportMessageRepository } = buildUseCase();

    await useCase.execute("user-1", {
      category: SupportCategory.OTHER,
      message: "  mensagem com espaços  ",
    });

    expect(supportMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: "mensagem com espaços" }),
    );
  });
});
