import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";
import { SendMarketingEmailUseCase } from "@/modules/marketing-emails/application/use-cases/send-marketing-email.use-case";

function buildUseCase(
  overrides: { mostRecentSend?: { createdAt: Date } | null } = {},
) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const marketingEmailRepository = {
    findMostRecentSendForEmail: jest
      .fn()
      .mockResolvedValue(overrides.mostRecentSend ?? null),
    create: jest.fn().mockImplementation((payload) =>
      Promise.resolve({
        idMarketingEmailSend: "send-1",
        ...payload,
      }),
    ),
  };

  const mailProvider = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const configService = {
    get: jest.fn().mockReturnValue("https://vaulto.app.br"),
  };

  const userRepository = {
    findOne: jest.fn().mockResolvedValue({ name: "Admin Vaulto" }),
  };

  const useCase = new SendMarketingEmailUseCase(
    authorizationService as never,
    marketingEmailRepository as never,
    mailProvider as never,
    configService as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    marketingEmailRepository,
    mailProvider,
    userRepository,
  };
}

const baseCommand = {
  category: MarketingEmailCategory.INFLUENCER,
  recipientEmail: "Parceiro@Example.com",
  recipientName: "Parceiro Teste",
  subject: "Parceria com o Vaulto",
  bodyMarkdown: "Olá! Tudo bem?",
};

describe("SendMarketingEmailUseCase", () => {
  it("rejects when the subject is empty", async () => {
    const { useCase, marketingEmailRepository } = buildUseCase();

    await expect(
      useCase.execute("admin-1", { ...baseCommand, subject: "   " }),
    ).rejects.toBeInstanceOf(AppException);
    expect(marketingEmailRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when the body is empty", async () => {
    const { useCase, marketingEmailRepository } = buildUseCase();

    await expect(
      useCase.execute("admin-1", { ...baseCommand, bodyMarkdown: "   " }),
    ).rejects.toBeInstanceOf(AppException);
    expect(marketingEmailRepository.create).not.toHaveBeenCalled();
  });

  it("blocks sending when the recipient was already contacted within 7 days", async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const { useCase, marketingEmailRepository, mailProvider } = buildUseCase({
      mostRecentSend: { createdAt: threeDaysAgo },
    });

    await expect(
      useCase.execute("admin-1", baseCommand),
    ).rejects.toBeInstanceOf(AppException);
    expect(mailProvider.send).not.toHaveBeenCalled();
    expect(marketingEmailRepository.create).not.toHaveBeenCalled();
  });

  it("allows sending again once the 7-day cooldown has passed", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const { useCase, marketingEmailRepository, mailProvider } = buildUseCase({
      mostRecentSend: { createdAt: eightDaysAgo },
    });

    await useCase.execute("admin-1", baseCommand);

    expect(mailProvider.send).toHaveBeenCalledTimes(1);
    expect(marketingEmailRepository.create).toHaveBeenCalledTimes(1);
  });

  it("normalizes the recipient email and persists the send after a successful dispatch", async () => {
    const {
      useCase,
      authorizationService,
      marketingEmailRepository,
      mailProvider,
    } = buildUseCase();

    const result = await useCase.execute("admin-1", baseCommand);

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.MANAGE_MARKETING_EMAILS,
    );
    expect(mailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { email: "parceiro@example.com", name: "Parceiro Teste" },
      }),
    );
    expect(marketingEmailRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "parceiro@example.com",
        sentByAdminId: "admin-1",
      }),
    );
    expect(result.sentByAdminName).toBe("Admin Vaulto");
  });

  it("carries the partnership percentage through to the persisted record", async () => {
    const { useCase, marketingEmailRepository } = buildUseCase();

    await useCase.execute("admin-1", {
      ...baseCommand,
      partnershipPercentage: 15,
    });

    expect(marketingEmailRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ partnershipPercentage: 15 }),
    );
  });

  it("does not persist the send when the mail provider throws", async () => {
    const { useCase, marketingEmailRepository, mailProvider } = buildUseCase();
    mailProvider.send.mockRejectedValueOnce(new Error("provider down"));

    await expect(
      useCase.execute("admin-1", baseCommand),
    ).rejects.toBeInstanceOf(AppException);
    expect(marketingEmailRepository.create).not.toHaveBeenCalled();
  });
});
