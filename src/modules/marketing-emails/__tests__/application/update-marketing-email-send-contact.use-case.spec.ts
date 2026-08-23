import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { MarketingEmailCategory } from "@/modules/marketing-emails/domain/enums/marketing-email-category.enum";
import { UpdateMarketingEmailSendContactUseCase } from "@/modules/marketing-emails/application/use-cases/update-marketing-email-send-contact.use-case";

function buildUseCase(overrides: { updated?: unknown } = {}) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const marketingEmailRepository = {
    updateContactInfo: jest.fn().mockResolvedValue(
      overrides.updated === undefined
        ? {
            idMarketingEmailSend: "send-1",
            sentByAdminId: "admin-1",
            recipientPhone: "(11) 91234-5678",
            socialMediaLink: "https://instagram.com/parceiro",
          }
        : overrides.updated,
    ),
  };

  const userRepository = {
    findOne: jest.fn().mockResolvedValue({ name: "Admin Vaulto" }),
  };

  const useCase = new UpdateMarketingEmailSendContactUseCase(
    authorizationService as never,
    marketingEmailRepository as never,
    userRepository as never,
  );

  return {
    useCase,
    authorizationService,
    marketingEmailRepository,
    userRepository,
  };
}

describe("UpdateMarketingEmailSendContactUseCase", () => {
  it("checks the manage-marketing-emails permission", async () => {
    const { useCase, authorizationService } = buildUseCase();

    await useCase.execute("admin-1", { idMarketingEmailSend: "send-1" });

    expect(authorizationService.assertPermissionForUserId).toHaveBeenCalledWith(
      "admin-1",
      AuthPermission.MANAGE_MARKETING_EMAILS,
    );
  });

  it("trims contact fields and clears them to null when left blank", async () => {
    const { useCase, marketingEmailRepository } = buildUseCase();

    await useCase.execute("admin-1", {
      idMarketingEmailSend: "send-1",
      recipientPhone: "  (11) 91234-5678  ",
      socialMediaLink: "   ",
    });

    expect(marketingEmailRepository.updateContactInfo).toHaveBeenCalledWith(
      "send-1",
      { recipientPhone: "(11) 91234-5678", socialMediaLink: null },
    );
  });

  it("carries the recipient name and category through when provided", async () => {
    const { useCase, marketingEmailRepository } = buildUseCase();

    await useCase.execute("admin-1", {
      idMarketingEmailSend: "send-1",
      recipientName: "  Novo Nome  ",
      category: MarketingEmailCategory.BUSINESS_PARTNER,
    });

    expect(marketingEmailRepository.updateContactInfo).toHaveBeenCalledWith(
      "send-1",
      expect.objectContaining({
        recipientName: "Novo Nome",
        category: MarketingEmailCategory.BUSINESS_PARTNER,
      }),
    );
  });

  it("ignores a blank recipient name instead of clearing it", async () => {
    const { useCase, marketingEmailRepository } = buildUseCase();

    await useCase.execute("admin-1", {
      idMarketingEmailSend: "send-1",
      recipientName: "   ",
    });

    expect(marketingEmailRepository.updateContactInfo).toHaveBeenCalledWith(
      "send-1",
      expect.objectContaining({ recipientName: undefined }),
    );
  });

  it("throws when the send does not exist", async () => {
    const { useCase } = buildUseCase({ updated: null });

    await expect(
      useCase.execute("admin-1", { idMarketingEmailSend: "missing" }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("attaches the admin display name to the returned view", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute("admin-1", {
      idMarketingEmailSend: "send-1",
    });

    expect(result.sentByAdminName).toBe("Admin Vaulto");
  });
});
