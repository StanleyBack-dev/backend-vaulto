import { ClawbackReferralCreditUseCase } from "@/modules/referrals/application/use-cases/clawback-referral-credit.use-case";

function buildUseCase(pendingCredit: Record<string, unknown> | null) {
  const referralCreditRepository = {
    findPendingByReferredUser: jest.fn().mockResolvedValue(pendingCredit),
    markClawedBack: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new ClawbackReferralCreditUseCase(
    referralCreditRepository as never,
  );

  return { useCase, referralCreditRepository };
}

describe("ClawbackReferralCreditUseCase", () => {
  it("claws back the pending credit tied to the referred user's refunded payment", async () => {
    const { useCase, referralCreditRepository } = buildUseCase({
      idReferralCredit: "credit-1",
    });

    await useCase.execute("referred-1");

    expect(
      referralCreditRepository.findPendingByReferredUser,
    ).toHaveBeenCalledWith("referred-1");
    expect(referralCreditRepository.markClawedBack).toHaveBeenCalledWith(
      "credit-1",
      expect.any(Date),
    );
  });

  it("does nothing when there is no pending credit for that referred user", async () => {
    const { useCase, referralCreditRepository } = buildUseCase(null);

    await useCase.execute("referred-1");

    expect(referralCreditRepository.markClawedBack).not.toHaveBeenCalled();
  });
});
