import { AppException } from "@/common/exceptions/app-exception";
import { RequestReferralWithdrawalUseCase } from "@/modules/referrals/application/use-cases/request-referral-withdrawal.use-case";
import { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";
import { ReferralWithdrawalStatus } from "@/modules/referrals/domain/enums/referral-withdrawal-status.enum";

function buildUseCase(
  overrides: {
    availableCents?: number;
    reservedCents?: number;
    transferResult?: {
      gatewayTransferId: string;
      status: string;
      failReason?: string;
    };
    transferError?: Error;
  } = {},
) {
  const referralCreditRepository = {
    sumAvailableForUser: jest
      .fn()
      .mockResolvedValue(overrides.availableCents ?? 2000),
  };

  const createdWithdrawal = {
    idReferralWithdrawal: "withdrawal-1",
    idUsers: "user-1",
    amountCents: overrides.availableCents ?? 2000,
    pixKey: "user@example.com",
    pixKeyType: PixKeyType.EMAIL,
    status: ReferralWithdrawalStatus.REQUESTED,
    requestedAt: new Date(),
  };

  const referralWithdrawalRepository = {
    sumActiveForUser: jest
      .fn()
      .mockResolvedValue(overrides.reservedCents ?? 0),
    create: jest.fn().mockResolvedValue(createdWithdrawal),
    update: jest.fn().mockImplementation((id, patch) =>
      Promise.resolve({ ...createdWithdrawal, ...patch }),
    ),
  };

  const paymentGateway = {
    createPixTransfer: overrides.transferError
      ? jest.fn().mockRejectedValue(overrides.transferError)
      : jest.fn().mockResolvedValue(
          overrides.transferResult ?? {
            gatewayTransferId: "transfer-1",
            status: "DONE",
          },
        ),
  };

  const useCase = new RequestReferralWithdrawalUseCase(
    referralCreditRepository as never,
    referralWithdrawalRepository as never,
    paymentGateway as never,
  );

  return {
    useCase,
    referralCreditRepository,
    referralWithdrawalRepository,
    paymentGateway,
    createdWithdrawal,
  };
}

describe("RequestReferralWithdrawalUseCase", () => {
  it("rejects when the available balance is below the minimum withdrawal", async () => {
    const { useCase } = buildUseCase({ availableCents: 1000 });

    await expect(
      useCase.execute("user-1", {
        pixKey: "user@example.com",
        pixKeyType: PixKeyType.EMAIL,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("subtracts already-reserved active withdrawals before checking the minimum", async () => {
    const { useCase } = buildUseCase({
      availableCents: 2000,
      reservedCents: 1500,
    });

    await expect(
      useCase.execute("user-1", {
        pixKey: "user@example.com",
        pixKeyType: PixKeyType.EMAIL,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("withdraws the full available balance, not a partial amount", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase({
      availableCents: 3500,
    });

    await useCase.execute("user-1", {
      pixKey: "user@example.com",
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(referralWithdrawalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ idUsers: "user-1", amountCents: 3500 }),
    );
  });

  it("sends the gateway the full amount in reais, with no fee subtracted from what the user receives", async () => {
    const { useCase, paymentGateway } = buildUseCase({
      availableCents: 2000,
    });

    await useCase.execute("user-1", {
      pixKey: "user@example.com",
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(paymentGateway.createPixTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 20,
        pixAddressKey: "user@example.com",
        pixAddressKeyType: PixKeyType.EMAIL,
      }),
    );
  });

  it("marks the withdrawal COMPLETED when the gateway returns DONE", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase();

    const result = await useCase.execute("user-1", {
      pixKey: "user@example.com",
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(referralWithdrawalRepository.update).toHaveBeenCalledWith(
      "withdrawal-1",
      expect.objectContaining({ status: ReferralWithdrawalStatus.COMPLETED }),
    );
    expect(result.status).toBe(ReferralWithdrawalStatus.COMPLETED);
  });

  it("marks the withdrawal PROCESSING when the gateway returns PENDING", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase({
      transferResult: { gatewayTransferId: "transfer-1", status: "PENDING" },
    });

    await useCase.execute("user-1", {
      pixKey: "user@example.com",
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(referralWithdrawalRepository.update).toHaveBeenCalledWith(
      "withdrawal-1",
      expect.objectContaining({ status: ReferralWithdrawalStatus.PROCESSING }),
    );
  });

  it("marks the withdrawal FAILED and rejects when the gateway itself throws", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase({
      transferError: new Error("gateway down"),
    });

    await expect(
      useCase.execute("user-1", {
        pixKey: "user@example.com",
        pixKeyType: PixKeyType.EMAIL,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(referralWithdrawalRepository.update).toHaveBeenCalledWith(
      "withdrawal-1",
      expect.objectContaining({ status: ReferralWithdrawalStatus.FAILED }),
    );
  });

  it("marks the withdrawal FAILED when the gateway explicitly returns FAILED", async () => {
    const { useCase, referralWithdrawalRepository } = buildUseCase({
      transferResult: {
        gatewayTransferId: "transfer-1",
        status: "FAILED",
        failReason: "Chave Pix inválida",
      },
    });

    await useCase.execute("user-1", {
      pixKey: "user@example.com",
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(referralWithdrawalRepository.update).toHaveBeenCalledWith(
      "withdrawal-1",
      expect.objectContaining({
        status: ReferralWithdrawalStatus.FAILED,
        failReason: "Chave Pix inválida",
      }),
    );
  });
});
