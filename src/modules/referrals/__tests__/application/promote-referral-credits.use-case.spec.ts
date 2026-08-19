import { PromoteReferralCreditsUseCase } from "@/modules/referrals/application/use-cases/promote-referral-credits.use-case";

function buildUseCase(dueCredits: Array<{ idReferralCredit: string }> = []) {
  const referralCreditRepository = {
    findDueForPromotion: jest.fn().mockResolvedValue(dueCredits),
    markAvailable: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new PromoteReferralCreditsUseCase(
    referralCreditRepository as never,
  );

  return { useCase, referralCreditRepository };
}

describe("PromoteReferralCreditsUseCase", () => {
  it("promotes every credit whose hold period has elapsed", async () => {
    const { useCase, referralCreditRepository } = buildUseCase([
      { idReferralCredit: "credit-1" },
      { idReferralCredit: "credit-2" },
    ]);

    const result = await useCase.execute();

    expect(referralCreditRepository.markAvailable).toHaveBeenCalledWith(
      "credit-1",
    );
    expect(referralCreditRepository.markAvailable).toHaveBeenCalledWith(
      "credit-2",
    );
    expect(result).toEqual({ promoted: 2 });
  });

  it("returns zero promoted when nothing is due", async () => {
    const { useCase, referralCreditRepository } = buildUseCase([]);

    const result = await useCase.execute();

    expect(referralCreditRepository.markAvailable).not.toHaveBeenCalled();
    expect(result).toEqual({ promoted: 0 });
  });
});
