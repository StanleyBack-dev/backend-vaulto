import { GetMyReferralWithdrawalsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-withdrawals.use-case";

describe("GetMyReferralWithdrawalsUseCase", () => {
  it("returns the withdrawal history for the given user", async () => {
    const withdrawals = [{ idReferralWithdrawal: "withdrawal-1" }];
    const referralWithdrawalRepository = {
      findByUser: jest.fn().mockResolvedValue(withdrawals),
    };

    const useCase = new GetMyReferralWithdrawalsUseCase(
      referralWithdrawalRepository as never,
    );

    const result = await useCase.execute("user-1");

    expect(referralWithdrawalRepository.findByUser).toHaveBeenCalledWith(
      "user-1",
    );
    expect(result).toBe(withdrawals);
  });
});
