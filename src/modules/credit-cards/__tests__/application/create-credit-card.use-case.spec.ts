import { AppException } from "@/common/exceptions/app-exception";
import { CreateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/create/create-credit-card.use-case";

function buildUseCase(repositoryOverrides: Record<string, unknown> = {}) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const creditCardRepository = {
    findByName: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({
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
    ...repositoryOverrides,
  };

  const useCase = new CreateCreditCardUseCase(
    authorizationService as never,
    creditCardRepository as never,
  );

  return { useCase, authorizationService, creditCardRepository };
}

describe("CreateCreditCardUseCase", () => {
  it("should create a credit card with a valid payload", async () => {
    const { useCase, creditCardRepository } = buildUseCase();

    const result = await useCase.execute("user-1", {
      name: "Nubank",
      creditLimit: 5000,
      dueDay: 10,
      closingDay: 3,
    });

    expect(result.idCreditCard).toBe("card-1");
    expect(creditCardRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        name: "Nubank",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 3,
        status: true,
      }),
    );
  });

  it("should reject an empty name", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        name: "   ",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 3,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should reject a non-positive credit limit", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        name: "Nubank",
        creditLimit: 0,
        dueDay: 10,
        closingDay: 3,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should reject a dueDay outside 1-31", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        name: "Nubank",
        creditLimit: 5000,
        dueDay: 32,
        closingDay: 3,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should reject a closingDay outside 1-31", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("user-1", {
        name: "Nubank",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 0,
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("should reject a duplicated name for the same user", async () => {
    const { useCase, creditCardRepository } = buildUseCase({
      findByName: jest.fn().mockResolvedValue({
        idCreditCard: "card-existing",
        name: "Nubank",
      }),
    });

    await expect(
      useCase.execute("user-1", {
        name: "Nubank",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 3,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(creditCardRepository.create).not.toHaveBeenCalled();
  });
});
