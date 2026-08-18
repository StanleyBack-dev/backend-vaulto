import { QualifyReferralUseCase } from "@/modules/referrals/application/use-cases/qualify-referral.use-case";
import { REFERRAL_CREDIT_AMOUNT_CENTS } from "@/modules/referrals/domain/constants/referral.constant";

function buildUseCase(
  overrides: {
    referredUser?: Record<string, unknown> | null;
    referrer?: Record<string, unknown> | null;
  } = {},
) {
  const referredUser =
    overrides.referredUser === undefined
      ? {
          idUsers: "referred-1",
          referredByUserId: "referrer-1",
          referralQualifiedAt: null,
        }
      : overrides.referredUser;

  const referrer =
    overrides.referrer === undefined
      ? {
          idUsers: "referrer-1",
          name: "Referrer",
          email: "referrer@example.com",
        }
      : overrides.referrer;

  const userRepository = {
    findOne: jest
      .fn()
      .mockResolvedValueOnce(referredUser)
      .mockResolvedValueOnce(referrer),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const referralCreditRepository = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const referralCreditGrantedEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new QualifyReferralUseCase(
    userRepository as never,
    referralCreditRepository as never,
    referralCreditGrantedEmailUseCase as never,
  );

  return {
    useCase,
    userRepository,
    referralCreditRepository,
    referralCreditGrantedEmailUseCase,
  };
}

describe("QualifyReferralUseCase", () => {
  it("grants a credit to the referrer when the referred user has no referrer yet qualified", async () => {
    const { useCase, referralCreditRepository, userRepository } =
      buildUseCase();

    await useCase.execute("referred-1");

    expect(userRepository.update).toHaveBeenCalledWith(
      { idUsers: "referred-1" },
      { referralQualifiedAt: expect.any(Date) },
    );
    expect(referralCreditRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "referrer-1",
        idReferredUser: "referred-1",
        amountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
      }),
    );
  });

  it("sets availableAt seven days after qualifiedAt", async () => {
    const { useCase, referralCreditRepository } = buildUseCase();

    await useCase.execute("referred-1");

    const payload = referralCreditRepository.create.mock.calls[0][0];
    const diffDays =
      (payload.availableAt.getTime() - payload.qualifiedAt.getTime()) /
      (24 * 60 * 60 * 1000);

    expect(diffDays).toBe(7);
  });

  it("sends the credit-granted email to the referrer", async () => {
    const { useCase, referralCreditGrantedEmailUseCase } = buildUseCase();

    await useCase.execute("referred-1");

    expect(referralCreditGrantedEmailUseCase.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "referrer@example.com",
        amountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
      }),
    );
  });

  it("does nothing when the referred user has no referrer", async () => {
    const { useCase, referralCreditRepository, userRepository } = buildUseCase(
      {
        referredUser: {
          idUsers: "referred-1",
          referredByUserId: null,
          referralQualifiedAt: null,
        },
      },
    );

    await useCase.execute("referred-1");

    expect(userRepository.update).not.toHaveBeenCalled();
    expect(referralCreditRepository.create).not.toHaveBeenCalled();
  });

  it("does nothing when the referred user already qualified before (idempotent)", async () => {
    const { useCase, referralCreditRepository, userRepository } = buildUseCase(
      {
        referredUser: {
          idUsers: "referred-1",
          referredByUserId: "referrer-1",
          referralQualifiedAt: new Date(),
        },
      },
    );

    await useCase.execute("referred-1");

    expect(userRepository.update).not.toHaveBeenCalled();
    expect(referralCreditRepository.create).not.toHaveBeenCalled();
  });
});
