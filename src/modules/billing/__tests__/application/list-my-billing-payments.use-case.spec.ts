import { ListMyBillingPaymentsUseCase } from "@/modules/billing/application/use-cases/get/list-my-billing-payments.use-case";
import { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";

function billingPaymentView(overrides: Record<string, unknown> = {}) {
  return {
    idBillingPayment: "payment-1",
    idUsers: "user-1",
    gatewayPaymentId: "pay_1",
    amount: 14.9,
    status: BillingPaymentStatus.CONFIRMED,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    records?: Record<string, unknown>[];
    total?: number;
  } = {},
) {
  const billingPaymentRepository = {
    listByUser: jest.fn().mockResolvedValue({
      records: overrides.records ?? [billingPaymentView()],
      total: overrides.total ?? 1,
    }),
  };

  const useCase = new ListMyBillingPaymentsUseCase(
    billingPaymentRepository as never,
  );

  return { useCase, billingPaymentRepository };
}

describe("ListMyBillingPaymentsUseCase", () => {
  it("lists the user's billing payments with default pagination", async () => {
    const { useCase, billingPaymentRepository } = buildUseCase();

    const result = await useCase.execute("user-1");

    expect(billingPaymentRepository.listByUser).toHaveBeenCalledWith("user-1", {
      page: 1,
      limit: 10,
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });

  it("forwards the requested page and limit", async () => {
    const { useCase, billingPaymentRepository } = buildUseCase({
      records: [],
      total: 25,
    });

    const result = await useCase.execute("user-1", { page: 2, limit: 10 });

    expect(billingPaymentRepository.listByUser).toHaveBeenCalledWith("user-1", {
      page: 2,
      limit: 10,
    });
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
  });
});
