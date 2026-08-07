import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { PlanLimitedResource } from "@/modules/billing/domain/enums/plan-limited-resource.enum";
import { CreateCreditCardUseCase } from "@/modules/credit-cards/application/use-cases/create/create-credit-card.use-case";

function buildUseCase(
  repositoryOverrides: Record<string, unknown> = {},
  planLimitsOverrides: Record<string, unknown> = {},
) {
  const authorizationService = {
    assertPermissionForUserId: jest.fn().mockResolvedValue(undefined),
  };

  const planLimitsService = {
    assertCanCreate: jest.fn().mockResolvedValue(undefined),
    ...planLimitsOverrides,
  };

  const creditCardRepository = {
    listByUser: jest.fn().mockResolvedValue({ records: [], total: 0 }),
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
    planLimitsService as never,
  );

  return {
    useCase,
    authorizationService,
    creditCardRepository,
    planLimitsService,
  };
}

describe("CreateCreditCardUseCase", () => {
  it("should create a credit card with a valid payload", async () => {
    const { useCase, creditCardRepository, planLimitsService } = buildUseCase();

    const result = await useCase.execute("user-1", {
      name: "Nubank",
      creditLimit: 5000,
      dueDay: 10,
      closingDay: 3,
    });

    expect(result.idCreditCard).toBe("card-1");
    expect(planLimitsService.assertCanCreate).toHaveBeenCalledWith(
      "user-1",
      PlanLimitedResource.CREDIT_CARDS,
      0,
    );
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

  it("should reject creation when the Free plan limit was reached", async () => {
    const { useCase, creditCardRepository } = buildUseCase(
      {},
      {
        assertCanCreate: jest.fn().mockRejectedValue(
          AppException.from(APP_ERRORS.billing.planLimitReached, {
            resource: "cartoes de credito",
            limit: 1,
          }),
        ),
      },
    );

    await expect(
      useCase.execute("user-1", {
        name: "Segundo cartao",
        creditLimit: 5000,
        dueDay: 10,
        closingDay: 3,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(creditCardRepository.findByName).not.toHaveBeenCalled();
    expect(creditCardRepository.create).not.toHaveBeenCalled();
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
