import { AppException } from "@/common/exceptions/app-exception";
import { HandleAsaasWebhookUseCase } from "@/modules/billing/application/use-cases/webhook/handle-asaas-webhook.use-case";
import { BillingPaymentStatus } from "@/modules/billing/domain/enums/billing-payment-status.enum";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { SubscriptionStatus } from "@/modules/billing/domain/enums/subscription-status.enum";

const WEBHOOK_TOKEN = "a".repeat(32);

function subscriptionView(overrides: Record<string, unknown> = {}) {
  return {
    idSubscription: "subscription-1",
    idUsers: "user-1",
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.TRIALING,
    cancelAtPeriodEnd: false,
    gatewaySubscriptionId: "sub_123",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUseCase(
  overrides: {
    subscription?: Record<string, unknown> | null;
    user?: Record<string, unknown> | null;
  } = {},
) {
  const configService = {
    get: jest.fn().mockReturnValue(WEBHOOK_TOKEN),
  };

  const subscriptionRepository = {
    findByGatewaySubscriptionId: jest
      .fn()
      .mockResolvedValue(
        overrides.subscription === undefined
          ? subscriptionView()
          : overrides.subscription,
      ),
    updateByUserId: jest.fn().mockResolvedValue(subscriptionView()),
  };

  const billingPaymentRepository = {
    upsertByGatewayPaymentId: jest.fn().mockResolvedValue(undefined),
  };

  const subscriptionActivatedEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const subscriptionContractedNotificationEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const paymentOverdueEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const userRepository = {
    findOne: jest
      .fn()
      .mockResolvedValue(
        overrides.user === undefined
          ? { idUsers: "user-1", email: "user@example.com", name: "User" }
          : overrides.user,
      ),
  };

  const useCase = new HandleAsaasWebhookUseCase(
    configService as never,
    subscriptionRepository as never,
    billingPaymentRepository as never,
    subscriptionActivatedEmailUseCase as never,
    subscriptionContractedNotificationEmailUseCase as never,
    paymentOverdueEmailUseCase as never,
    userRepository as never,
  );

  return {
    useCase,
    subscriptionRepository,
    billingPaymentRepository,
    subscriptionActivatedEmailUseCase,
    subscriptionContractedNotificationEmailUseCase,
    paymentOverdueEmailUseCase,
    userRepository,
  };
}

describe("HandleAsaasWebhookUseCase", () => {
  it("rejects when the token header does not match the configured webhook token", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute("wrong-token", {
        event: "PAYMENT_RECEIVED",
        payment: {
          id: "pay_1",
          subscription: "sub_123",
          value: 14.9,
          status: "RECEIVED",
        },
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("rejects when no webhook token is configured", async () => {
    const useCaseWithoutToken = new HandleAsaasWebhookUseCase(
      { get: jest.fn().mockReturnValue(undefined) } as never,
      { findByGatewaySubscriptionId: jest.fn() } as never,
      { upsertByGatewayPaymentId: jest.fn() } as never,
      { send: jest.fn() } as never,
      { send: jest.fn() } as never,
      { send: jest.fn() } as never,
      { findOne: jest.fn() } as never,
    );

    await expect(
      useCaseWithoutToken.execute(WEBHOOK_TOKEN, {
        event: "PAYMENT_RECEIVED",
        payment: {
          id: "pay_1",
          subscription: "sub_123",
          value: 14.9,
          status: "RECEIVED",
        },
      }),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("activates the subscription, records the payment and sends the activation email on PAYMENT_CONFIRMED", async () => {
    const {
      useCase,
      subscriptionRepository,
      billingPaymentRepository,
      subscriptionActivatedEmailUseCase,
      subscriptionContractedNotificationEmailUseCase,
    } = buildUseCase();

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_1",
        subscription: "sub_123",
        value: 14.9,
        status: "CONFIRMED",
        dueDate: "2026-08-15",
      },
    });

    expect(
      billingPaymentRepository.upsertByGatewayPaymentId,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "user-1",
        gatewayPaymentId: "pay_1",
        amount: 14.9,
        status: BillingPaymentStatus.CONFIRMED,
        paidAt: expect.any(Date),
      }),
    );
    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        pastDueSince: null,
      }),
    );
    expect(subscriptionActivatedEmailUseCase.send).toHaveBeenCalledWith({
      to: "user@example.com",
      name: "User",
    });
    expect(
      subscriptionContractedNotificationEmailUseCase.send,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        userName: "User",
        userEmail: "user@example.com",
      }),
    );
  });

  it("computes currentPeriodEnd one month after the paid dueDate for a MONTHLY subscription", async () => {
    const { useCase, subscriptionRepository } = buildUseCase({
      subscription: subscriptionView({
        billingCycle: SubscriptionBillingCycle.MONTHLY,
      }),
    });

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_monthly",
        subscription: "sub_123",
        value: 14.9,
        status: "CONFIRMED",
        dueDate: "2026-08-15",
      },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ currentPeriodEnd: new Date("2026-09-15") }),
    );
  });

  it("computes currentPeriodEnd one year after the paid dueDate for a YEARLY subscription", async () => {
    const { useCase, subscriptionRepository } = buildUseCase({
      subscription: subscriptionView({
        billingCycle: SubscriptionBillingCycle.YEARLY,
      }),
    });

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_yearly",
        subscription: "sub_123",
        value: 149.9,
        status: "CONFIRMED",
        dueDate: "2026-08-15",
      },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ currentPeriodEnd: new Date("2027-08-15") }),
    );
  });

  it("does not set currentPeriodEnd when the subscription has no billingCycle on record", async () => {
    const { useCase, subscriptionRepository } = buildUseCase();

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_legacy",
        subscription: "sub_123",
        value: 14.9,
        status: "CONFIRMED",
        dueDate: "2026-08-15",
      },
    });

    const [, payload] = subscriptionRepository.updateByUserId.mock.calls[0];
    expect(payload).not.toHaveProperty("currentPeriodEnd");
  });

  it("activates the subscription on PAYMENT_RECEIVED as well", async () => {
    const { useCase, subscriptionRepository } = buildUseCase();

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_2",
        subscription: "sub_123",
        value: 14.9,
        status: "RECEIVED",
      },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      }),
    );
  });

  it("does not resend the activation email when the subscription was already ACTIVE", async () => {
    const { useCase, subscriptionActivatedEmailUseCase } = buildUseCase({
      subscription: subscriptionView({ status: SubscriptionStatus.ACTIVE }),
    });

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_renewal",
        subscription: "sub_123",
        value: 14.9,
        status: "CONFIRMED",
      },
    });

    expect(subscriptionActivatedEmailUseCase.send).not.toHaveBeenCalled();
  });

  it("marks the subscription as PAST_DUE, sets pastDueSince and sends the overdue email on PAYMENT_OVERDUE", async () => {
    const { useCase, subscriptionRepository, paymentOverdueEmailUseCase } =
      buildUseCase();

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_3",
        subscription: "sub_123",
        value: 14.9,
        status: "OVERDUE",
      },
    });

    expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        status: SubscriptionStatus.PAST_DUE,
        pastDueSince: expect.any(Date),
      }),
    );
    expect(paymentOverdueEmailUseCase.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com", name: "User" }),
    );
  });

  it("does not re-flag or re-notify a subscription that is already PAST_DUE", async () => {
    const { useCase, subscriptionRepository, paymentOverdueEmailUseCase } =
      buildUseCase({
        subscription: subscriptionView({
          status: SubscriptionStatus.PAST_DUE,
          pastDueSince: new Date("2026-01-01"),
        }),
      });

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_3b",
        subscription: "sub_123",
        value: 14.9,
        status: "OVERDUE",
      },
    });

    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
    expect(paymentOverdueEmailUseCase.send).not.toHaveBeenCalled();
  });

  it.each(["PAYMENT_DELETED", "PAYMENT_REFUNDED"])(
    "downgrades the subscription to FREE/CANCELED on %s",
    async (event) => {
      const { useCase, subscriptionRepository } = buildUseCase();

      await useCase.execute(WEBHOOK_TOKEN, {
        event,
        payment: {
          id: "pay_4",
          subscription: "sub_123",
          value: 14.9,
          status: event === "PAYMENT_DELETED" ? "DELETED" : "REFUNDED",
        },
      });

      expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.CANCELED,
        }),
      );
    },
  );

  it("ignores payment events for a subscription it doesn't recognize", async () => {
    const { useCase, subscriptionRepository, billingPaymentRepository } =
      buildUseCase({ subscription: null });

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_5",
        subscription: "sub_unknown",
        value: 14.9,
        status: "CONFIRMED",
      },
    });

    expect(
      billingPaymentRepository.upsertByGatewayPaymentId,
    ).not.toHaveBeenCalled();
    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
  });

  it("ignores payment events without a subscription reference", async () => {
    const { useCase, billingPaymentRepository } = buildUseCase();

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: "pay_6",
        value: 14.9,
        status: "CONFIRMED",
      },
    });

    expect(
      billingPaymentRepository.upsertByGatewayPaymentId,
    ).not.toHaveBeenCalled();
  });

  it.each(["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"])(
    "downgrades the subscription to FREE/CANCELED on %s subscription-level events",
    async (event) => {
      const { useCase, subscriptionRepository } = buildUseCase();

      await useCase.execute(WEBHOOK_TOKEN, {
        event,
        subscription: { id: "sub_123", status: "INACTIVE" },
      });

      expect(subscriptionRepository.updateByUserId).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false,
        }),
      );
    },
  );

  it("ignores informational subscription events like SUBSCRIPTION_UPDATED", async () => {
    const { useCase, subscriptionRepository } = buildUseCase();

    await useCase.execute(WEBHOOK_TOKEN, {
      event: "SUBSCRIPTION_UPDATED",
      subscription: { id: "sub_123", status: "ACTIVE" },
    });

    expect(subscriptionRepository.updateByUserId).not.toHaveBeenCalled();
  });
});
