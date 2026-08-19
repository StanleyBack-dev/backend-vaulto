import { SyncReferralWithdrawalTransferStatusUseCase } from "@/modules/referrals/application/use-cases/sync-referral-withdrawal-transfer-status.use-case";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

function buildUseCase(withdrawal: Record<string, unknown> | null) {
  const referralWithdrawalRepository = {
    findByGatewayTransferId: jest.fn().mockResolvedValue(withdrawal),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new SyncReferralWithdrawalTransferStatusUseCase(
    referralWithdrawalRepository as never,
  );

  return { useCase, referralWithdrawalRepository };
}

describe("SyncReferralWithdrawalTransferStatusUseCase", () => {
  it("marks the withdrawal COMPLETED when the transfer is DONE", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase({
      idReferralWithdrawal: "withdrawal-1",
    });

    await useCase.execute({
      gatewayTransferId: "transfer-1",
      gatewayStatus: "DONE",
    });

    expect(referralWithdrawalRepository.update).toHaveBeenCalledWith(
      "withdrawal-1",
      expect.objectContaining({ status: ReferralWithdrawalStatus.COMPLETED }),
    );
  });

  it("marks the withdrawal FAILED and stores the fail reason when the transfer fails", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase({
      idReferralWithdrawal: "withdrawal-1",
    });

    await useCase.execute({
      gatewayTransferId: "transfer-1",
      gatewayStatus: "FAILED",
      failReason: "Chave Pix inválida",
    });

    expect(referralWithdrawalRepository.update).toHaveBeenCalledWith(
      "withdrawal-1",
      expect.objectContaining({
        status: ReferralWithdrawalStatus.FAILED,
        failReason: "Chave Pix inválida",
      }),
    );
  });

  it("ignores transfers that don't belong to a known referral withdrawal", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase(null);

    await useCase.execute({
      gatewayTransferId: "unrelated-transfer",
      gatewayStatus: "DONE",
    });

    expect(referralWithdrawalRepository.update).not.toHaveBeenCalled();
  });
});
