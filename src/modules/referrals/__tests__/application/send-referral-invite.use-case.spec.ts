import { AppException } from "@/common/exceptions/app-exception";
import { SendReferralInviteUseCase } from "@/modules/referrals/application/use-cases/send-referral-invite.use-case";

function buildUseCase(
  overrides: {
    alreadyInvited?: unknown;
    referrer?: Record<string, unknown>;
    referralCode?: string;
  } = {},
) {
  const referralInviteRepository = {
    findOne: jest.fn().mockResolvedValue(overrides.alreadyInvited ?? null),
    create: jest.fn((payload: unknown) => payload),
    save: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOneOrFail: jest
      .fn()
      .mockResolvedValue(
        overrides.referrer ?? { idUsers: "user-1", name: "Messi Referrer" },
      ),
  };

  const getMyReferralStatsUseCase = {
    execute: jest
      .fn()
      .mockResolvedValue({ referralCode: overrides.referralCode ?? "ABC123" }),
  };

  const referralInviteEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new SendReferralInviteUseCase(
    referralInviteRepository as never,
    userRepository as never,
    getMyReferralStatsUseCase as never,
    referralInviteEmailUseCase as never,
  );

  return {
    useCase,
    referralInviteRepository,
    userRepository,
    getMyReferralStatsUseCase,
    referralInviteEmailUseCase,
  };
}

describe("SendReferralInviteUseCase", () => {
  it("rejects with a friendly error when the referrer already invited that email", async () => {
    const { useCase, referralInviteEmailUseCase } = buildUseCase({
      alreadyInvited: { idReferralInvite: "invite-1" },
    });

    await expect(
      useCase.execute("user-1", "amigo@example.com"),
    ).rejects.toBeInstanceOf(AppException);
    expect(referralInviteEmailUseCase.send).not.toHaveBeenCalled();
  });

  it("normalizes the target email before checking for duplicates and sending", async () => {
    const { useCase, referralInviteRepository, referralInviteEmailUseCase } =
      buildUseCase();

    await useCase.execute("user-1", "  Amigo@Example.COM  ");

    expect(referralInviteRepository.findOne).toHaveBeenCalledWith({
      where: { idUsers: "user-1", targetEmail: "amigo@example.com" },
    });
    expect(referralInviteEmailUseCase.send).toHaveBeenCalledWith({
      to: "amigo@example.com",
      referrerName: "Messi Referrer",
      referralCode: "ABC123",
    });
  });

  it("records the invite only after the email is sent successfully", async () => {
    const { useCase, referralInviteRepository } = buildUseCase();

    await useCase.execute("user-1", "amigo@example.com");

    expect(referralInviteRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        targetEmail: "amigo@example.com",
      }),
    );
  });

  it("does not record the invite when sending the email fails", async () => {
    const { useCase, referralInviteRepository, referralInviteEmailUseCase } =
      buildUseCase();
    referralInviteEmailUseCase.send.mockRejectedValue(
      new Error("mail provider down"),
    );

    await expect(
      useCase.execute("user-1", "amigo@example.com"),
    ).rejects.toBeInstanceOf(AppException);
    expect(referralInviteRepository.save).not.toHaveBeenCalled();
  });
});
