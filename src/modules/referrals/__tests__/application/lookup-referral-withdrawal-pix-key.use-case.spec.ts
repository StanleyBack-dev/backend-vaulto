import { AppException } from "@/common/exceptions/app-exception";
import { LookupReferralWithdrawalPixKeyUseCase } from "@/modules/referrals/application/use-cases/lookup-referral-withdrawal-pix-key.use-case";
import { PixKeyType } from "@/modules/referrals/domain/enums/pix-key-type.enum";

function buildUseCase(
  overrides: {
    lookupResult?: {
      bankName: string;
      ownerName: string;
      ownerDocument: string;
    };
    lookupError?: Error;
  } = {},
) {
  const paymentGateway = {
    lookupPixKey: overrides.lookupError
      ? jest.fn().mockRejectedValue(overrides.lookupError)
      : jest.fn().mockResolvedValue(
          overrides.lookupResult ?? {
            bankName: "Asaas I.P S.A",
            ownerName: "João da Silva",
            ownerDocument: "***.516.151-**",
          },
        ),
  };

  const useCase = new LookupReferralWithdrawalPixKeyUseCase(
    paymentGateway as never,
  );

  return { useCase, paymentGateway };
}

describe("LookupReferralWithdrawalPixKeyUseCase", () => {
  it("returns the bank and owner info resolved by the payment gateway", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute("user-1", {
      pixKey: "e1474eb5-c107-4b28-9e3f-dfcb83188874",
      pixKeyType: PixKeyType.EVP,
    });

    expect(result).toEqual({
      bankName: "Asaas I.P S.A",
      ownerName: "João da Silva",
      ownerDocument: "***.516.151-**",
    });
  });

  it("forwards the pix key and type to the payment gateway", async () => {
    const { useCase, paymentGateway } = buildUseCase();

    await useCase.execute("user-1", {
      pixKey: "user@example.com",
      pixKeyType: PixKeyType.EMAIL,
    });

    expect(paymentGateway.lookupPixKey).toHaveBeenCalledWith({
      pixKeyType: PixKeyType.EMAIL,
      pixKey: "user@example.com",
    });
  });

  it("rejects with a referrals-specific error when the gateway lookup fails", async () => {
    const { useCase } = buildUseCase({
      lookupError: new Error("key not found"),
    });

    await expect(
      useCase.execute("user-1", {
        pixKey: "00000000-0000-4000-8000-000000000000",
        pixKeyType: PixKeyType.EVP,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
