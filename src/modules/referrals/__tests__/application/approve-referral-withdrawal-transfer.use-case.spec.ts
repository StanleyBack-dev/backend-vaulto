import { AppException } from "@/common/exceptions/app-exception";
import { ApproveReferralWithdrawalTransferUseCase } from "@/modules/referrals/application/use-cases/approve-referral-withdrawal-transfer.use-case";

const WEBHOOK_TOKEN = "a".repeat(32);

function buildUseCase(withdrawal: Record<string, unknown> | null) {
  const configService = {
    get: jest.fn().mockReturnValue(WEBHOOK_TOKEN),
  };

  const referralWithdrawalRepository = {
    findByGatewayTransferId: jest.fn().mockResolvedValue(withdrawal),
  };

  const useCase = new ApproveReferralWithdrawalTransferUseCase(
    configService as never,
    referralWithdrawalRepository as never,
  );

  return { useCase, configService, referralWithdrawalRepository };
}

describe("ApproveReferralWithdrawalTransferUseCase", () => {
  it("approves a transfer that matches a known referral withdrawal", async () => {
    const { useCase } = buildUseCase({ idReferralWithdrawal: "withdrawal-1" });

    const result = await useCase.execute(WEBHOOK_TOKEN, "transfer-1");

    expect(result).toEqual({ approved: true });
  });

  it("refuses a transfer with no matching referral withdrawal", async () => {
    const { useCase } = buildUseCase(null);

    const result = await useCase.execute(WEBHOOK_TOKEN, "unknown-transfer");

    expect(result.approved).toBe(false);
    expect(result.refuseReason).toBeTruthy();
  });

  it("rejects when the webhook token does not match", async () => {
    const { useCase } = buildUseCase({ idReferralWithdrawal: "withdrawal-1" });

    await expect(
      useCase.execute("wrong-token", "transfer-1"),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects when no webhook token is configured", async () => {
    const referralWithdrawalRepository = {
      findByGatewayTransferId: jest.fn(),
    };
    const useCase = new ApproveReferralWithdrawalTransferUseCase(
      { get: jest.fn().mockReturnValue(undefined) } as never,
      referralWithdrawalRepository as never,
    );

    await expect(
      useCase.execute(WEBHOOK_TOKEN, "transfer-1"),
    ).rejects.toBeInstanceOf(AppException);
  });
});
