import { GetMyReferralStatsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import {
  REFERRAL_CREDIT_AMOUNT_CENTS,
  REFERRAL_CREDIT_HOLD_DAYS,
  REFERRAL_MIN_WITHDRAWAL_CENTS,
} from "@/modules/referrals/domain/constants/referral.constant";

function buildUseCase(
  overrides: {
    user?: Record<string, unknown>;
    qualifiedCount?: number;
    availableCents?: number;
    pendingHoldCents?: number;
    reservedCents?: number;
  } = {},
) {
  const user = overrides.user ?? { idUsers: "user-1", referralCode: "ABC123" };

  const userRepository = {
    findOneOrFail: jest.fn().mockResolvedValue(user),
    count: jest.fn().mockResolvedValue(overrides.qualifiedCount ?? 0),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const referralCreditRepository = {
    sumAvailableForUser: jest
      .fn()
      .mockResolvedValue(overrides.availableCents ?? 0),
    sumPendingHoldForUser: jest
      .fn()
      .mockResolvedValue(overrides.pendingHoldCents ?? 0),
  };

  const referralWithdrawalRepository = {
    sumActiveForUser: jest.fn().mockResolvedValue(overrides.reservedCents ?? 0),
  };

  const useCase = new GetMyReferralStatsUseCase(
    userRepository as never,
    referralCreditRepository as never,
    referralWithdrawalRepository as never,
  );

  return { useCase, userRepository, referralCreditRepository };
}

describe("GetMyReferralStatsUseCase", () => {
  it("returns the wallet snapshot with constants and computed balances", async () => {
    const { useCase } = buildUseCase({
      qualifiedCount: 4,
      availableCents: 1500,
      pendingHoldCents: 500,
      reservedCents: 0,
    });

    const result = await useCase.execute("user-1");

    expect(result).toEqual({
      referralCode: "ABC123",
      qualifiedReferralsCount: 4,
      creditAmountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
      minWithdrawalCents: REFERRAL_MIN_WITHDRAWAL_CENTS,
      creditHoldDays: REFERRAL_CREDIT_HOLD_DAYS,
      availableBalanceCents: 1500,
      pendingHoldBalanceCents: 500,
    });
  });

  it("subtracts amounts already reserved by active withdrawal requests", async () => {
    const { useCase } = buildUseCase({
      availableCents: 1000,
      reservedCents: 400,
    });

    const result = await useCase.execute("user-1");

    expect(result.availableBalanceCents).toBe(600);
  });

  it("never returns a negative available balance", async () => {
    const { useCase } = buildUseCase({
      availableCents: 500,
      reservedCents: 800,
    });

    const result = await useCase.execute("user-1");

    expect(result.availableBalanceCents).toBe(0);
  });

  it("assigns a referral code when the user doesn't have one yet", async () => {
    const { useCase, userRepository } = buildUseCase({
      user: { idUsers: "user-1", referralCode: null },
    });
    userRepository.count.mockResolvedValueOnce(0).mockResolvedValue(0);

    const result = await useCase.execute("user-1");

    expect(userRepository.update).toHaveBeenCalledWith(
      { idUsers: "user-1" },
      { referralCode: expect.any(String) },
    );
    expect(result.referralCode).toEqual(expect.any(String));
  });
});
