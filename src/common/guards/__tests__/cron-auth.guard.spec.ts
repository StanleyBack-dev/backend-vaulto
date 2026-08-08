import { CronAuthGuard } from "@/common/guards/cron-auth.guard";
import { AppException } from "@/common/exceptions/app-exception";

const CRON_SECRET = "a".repeat(16);

function buildExecutionContext(authorization?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  } as never;
}

function buildGuard(overrides: { secret?: string } = {}) {
  const configService = {
    get: jest
      .fn()
      .mockReturnValue("secret" in overrides ? overrides.secret : CRON_SECRET),
  };
  return new CronAuthGuard(configService as never);
}

describe("CronAuthGuard", () => {
  it("allows the request when the bearer token matches CRON_SECRET", () => {
    const guard = buildGuard();

    expect(
      guard.canActivate(buildExecutionContext(`Bearer ${CRON_SECRET}`)),
    ).toBe(true);
  });

  it("rejects when the bearer token does not match CRON_SECRET", () => {
    const guard = buildGuard();

    expect(() =>
      guard.canActivate(buildExecutionContext("Bearer wrong-token")),
    ).toThrow(AppException);
  });

  it("rejects when no authorization header is provided", () => {
    const guard = buildGuard();

    expect(() => guard.canActivate(buildExecutionContext(undefined))).toThrow(
      AppException,
    );
  });

  it("rejects when CRON_SECRET is not configured", () => {
    const guard = buildGuard({ secret: undefined });

    expect(() =>
      guard.canActivate(buildExecutionContext(`Bearer ${CRON_SECRET}`)),
    ).toThrow(AppException);
  });
});
