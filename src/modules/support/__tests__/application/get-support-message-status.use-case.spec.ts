import { GetSupportMessageStatusUseCase } from "@/modules/support/application/use-cases/get-support-message-status.use-case";

function buildUseCase(overrides: { hasMessageSince?: boolean } = {}) {
  const supportMessageRepository = {
    hasMessageSince: jest
      .fn()
      .mockResolvedValue(overrides.hasMessageSince ?? false),
    create: jest.fn(),
  };

  const useCase = new GetSupportMessageStatusUseCase(
    supportMessageRepository as never,
  );

  return { useCase, supportMessageRepository };
}

describe("GetSupportMessageStatusUseCase", () => {
  it("allows sending when no message was sent today", async () => {
    const { useCase } = buildUseCase({ hasMessageSince: false });

    const status = await useCase.execute("user-1");

    expect(status).toEqual({ canSend: true, nextAllowedAt: null });
  });

  it("blocks sending and returns tomorrow's start when already sent today", async () => {
    const { useCase } = buildUseCase({ hasMessageSince: true });

    const status = await useCase.execute("user-1");

    expect(status.canSend).toBe(false);
    expect(status.nextAllowedAt).toBeInstanceOf(Date);
    expect(status.nextAllowedAt!.getTime()).toBeGreaterThan(Date.now());
  });
});
