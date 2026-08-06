import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { LoginService } from "@/modules/auth/application/use-cases/login.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

function buildDeps(overrides?: {
  findByUsername?: jest.Mock;
  ensureCredentialCanAuthenticate?: jest.Mock;
  verifyPassword?: jest.Mock;
}) {
  const authCredentialsUseCase = {
    findByUsername:
      overrides?.findByUsername ??
      jest.fn().mockResolvedValue(authCredentialMock),
    ensureCredentialCanAuthenticate:
      overrides?.ensureCredentialCanAuthenticate ??
      jest.fn().mockResolvedValue(undefined),
    registerFailedLogin: jest.fn().mockResolvedValue(undefined),
    registerSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
  };

  const passwordHasherUseCase = {
    verifyPassword:
      overrides?.verifyPassword ?? jest.fn().mockResolvedValue(true),
  };

  const authTokensUseCase = {
    signAccessToken: jest.fn().mockReturnValue("access-token"),
    signRefreshToken: jest.fn().mockReturnValue("refresh-token"),
    getRefreshTokenMaxAgeMs: jest.fn().mockReturnValue(1000 * 60 * 60),
  };

  const createSessionUseCase = {
    execute: jest.fn().mockResolvedValue(undefined),
  };

  return {
    authCredentialsUseCase,
    passwordHasherUseCase,
    authTokensUseCase,
    createSessionUseCase,
  };
}

describe("LoginService", () => {
  it("rejects when no credential exists for the given username", async () => {
    const deps = buildDeps({
      findByUsername: jest.fn().mockResolvedValue(null),
    });
    const service = new LoginService(
      deps.authCredentialsUseCase as never,
      deps.passwordHasherUseCase as never,
      deps.authTokensUseCase as never,
      deps.createSessionUseCase as never,
    );

    const error = await captureError(() =>
      service.execute(
        { username: "ghost", password: "whatever" },
        { ipAddress: "127.0.0.1", userAgent: "jest" },
      ),
    );

    expect(error).toBeInstanceOf(AppException);
    expect(error).toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      response: { code: APP_ERRORS.auth.invalidCredentials.code },
    });
    expect(deps.createSessionUseCase.execute).not.toHaveBeenCalled();
  });

  it("propagates a locked/inactive credential rejection without touching the password", async () => {
    const lockedError = AppException.from(
      APP_ERRORS.auth.credentialLocked,
      undefined,
    );
    const deps = buildDeps({
      ensureCredentialCanAuthenticate: jest.fn().mockRejectedValue(lockedError),
    });
    const service = new LoginService(
      deps.authCredentialsUseCase as never,
      deps.passwordHasherUseCase as never,
      deps.authTokensUseCase as never,
      deps.createSessionUseCase as never,
    );

    const error = await captureError(() =>
      service.execute(
        { username: authCredentialMock.username, password: "whatever" },
        { ipAddress: "127.0.0.1", userAgent: "jest" },
      ),
    );

    expect(error).toBe(lockedError);
    expect(deps.passwordHasherUseCase.verifyPassword).not.toHaveBeenCalled();
  });

  it("registers a failed login attempt and rejects on a wrong password", async () => {
    const deps = buildDeps({
      verifyPassword: jest.fn().mockResolvedValue(false),
    });
    const service = new LoginService(
      deps.authCredentialsUseCase as never,
      deps.passwordHasherUseCase as never,
      deps.authTokensUseCase as never,
      deps.createSessionUseCase as never,
    );

    const error = await captureError(() =>
      service.execute(
        { username: authCredentialMock.username, password: "wrong-password" },
        { ipAddress: "127.0.0.1", userAgent: "jest" },
      ),
    );

    expect(error).toBeInstanceOf(AppException);
    expect(error).toMatchObject({
      response: { code: APP_ERRORS.auth.invalidCredentials.code },
    });
    expect(
      deps.authCredentialsUseCase.registerFailedLogin,
    ).toHaveBeenCalledWith(authCredentialMock);
    expect(deps.createSessionUseCase.execute).not.toHaveBeenCalled();
  });

  it("issues tokens, opens a session and registers a successful login on valid credentials", async () => {
    const deps = buildDeps();
    const service = new LoginService(
      deps.authCredentialsUseCase as never,
      deps.passwordHasherUseCase as never,
      deps.authTokensUseCase as never,
      deps.createSessionUseCase as never,
    );

    const result = await service.execute(
      { username: authCredentialMock.username, password: "correct-password" },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.response.authenticated).toBe(true);
    expect(result.response.mustChangePassword).toBe(
      authCredentialMock.mustChangePassword,
    );
    expect(deps.createSessionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(
      deps.authCredentialsUseCase.registerSuccessfulLogin,
    ).toHaveBeenCalledWith(authCredentialMock);
    expect(
      deps.authCredentialsUseCase.registerFailedLogin,
    ).not.toHaveBeenCalled();
  });
});
