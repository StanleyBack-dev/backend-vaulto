import { AppException } from "@/common/exceptions/app-exception";
import { UpdateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/update/update-credit-card.use-case";

function buildUseCase(repositoryOverrides: Record<string, unknown> = {}) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const creditCardRepository = {
    findById: jest.fn().mockResolvedValue({
      idCreditCard: "card-1",
      idUsers: "user-1",
      name: "Nubank",
      creditLimit: 5000,
      dueDay: 10,
      closingDay: 3,
      status: true,
      usedLimit: 0,
      availableLimit: 5000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByName: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({
      idCreditCard: "card-1",
      idUsers: "user-1",
      name: "Nubank Ultravioleta",
      creditLimit: 8000,
      dueDay: 12,
      closingDay: 5,
      status: true,
      usedLimit: 0,
      availableLimit: 8000,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...repositoryOverrides,
  };

  const useCase = new UpdateCreditCardUseCase(
    authorizationService as never,
    creditCardRepository as never,
  );

  return { useCase, authorizationService, creditCardRepository };
}

describe("UpdateCreditCardUseCase", () => {
  it("should update a credit card with a valid payload", async () => {
    const { useCase, creditCardRepository } = buildUseCase();

    const result = await useCase.execute("user-1", {
      idCreditCard: "card-1",
      name: "Nubank Ultravioleta",
      creditLimit: 8000,
      dueDay: 12,
      closingDay: 5,
      status: true,
    });

    expect(result.name).toBe("Nubank Ultravioleta");
    expect(creditCardRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        idCreditCard: "card-1",
        name: "Nubank Ultravioleta",
        creditLimit: 8000,
        dueDay: 12,
        closingDay: 5,
      }),
    );
  });

  it("should reject when the credit card does not exist for this user", async () => {
    const { useCase, creditCardRepository } = buildUseCase({
      findById: jest.fn().mockResolvedValue(null),
    });

    await expect(
      useCase.execute("user-1", {
        idCreditCard: "missing-card",
        name: "Nubank",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 3,
        status: true,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(creditCardRepository.update).not.toHaveBeenCalled();
  });

  it("should reject renaming to a name already used by another card", async () => {
    const { useCase, creditCardRepository } = buildUseCase({
      findByName: jest.fn().mockResolvedValue({
        idCreditCard: "another-card",
        name: "Inter",
      }),
    });

    await expect(
      useCase.execute("user-1", {
        idCreditCard: "card-1",
        name: "Inter",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 3,
        status: true,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(creditCardRepository.update).not.toHaveBeenCalled();
  });

  it("should allow keeping the same name on the same card", async () => {
    const { useCase, creditCardRepository } = buildUseCase({
      findByName: jest.fn().mockResolvedValue({
        idCreditCard: "card-1",
        name: "Nubank",
      }),
    });

    await useCase.execute("user-1", {
      idCreditCard: "card-1",
      name: "Nubank",
      creditLimit: 5000,
      dueDay: 10,
      closingDay: 3,
      status: true,
    });

    expect(creditCardRepository.update).toHaveBeenCalledTimes(1);
  });

  it("should reject an invalid credit limit", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        idCreditCard: "card-1",
        name: "Nubank",
        creditLimit: -1,
        dueDay: 10,
        closingDay: 3,
        status: true,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });
});
