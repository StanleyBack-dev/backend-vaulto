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

const issuedSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  response: {
    authenticated: true,
    mustChangePassword: authCredentialMock.mustChangePassword,
    user: {
      idUsers: authCredentialMock.user.idUsers,
      name: authCredentialMock.user.name,
      email: authCredentialMock.user.email,
      username: authCredentialMock.username,
      group: authCredentialMock.user.group,
      status: authCredentialMock.user.status,
      urlAvatar: authCredentialMock.user.urlAvatar,
    },
  },
};

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
  };

  const passwordHasherUseCase = {
    verifyPassword:
      overrides?.verifyPassword ?? jest.fn().mockResolvedValue(true),
  };

  const issueAuthSessionUseCase = {
    execute: jest.fn().mockResolvedValue(issuedSession),
  };

  return {
    authCredentialsUseCase,
    passwordHasherUseCase,
    issueAuthSessionUseCase,
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
      deps.issueAuthSessionUseCase as never,
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
    expect(deps.issueAuthSessionUseCase.execute).not.toHaveBeenCalled();
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
      deps.issueAuthSessionUseCase as never,
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
      deps.issueAuthSessionUseCase as never,
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
    expect(deps.issueAuthSessionUseCase.execute).not.toHaveBeenCalled();
  });

  it("delegates session issuance on valid credentials", async () => {
    const deps = buildDeps();
    const service = new LoginService(
      deps.authCredentialsUseCase as never,
      deps.passwordHasherUseCase as never,
      deps.issueAuthSessionUseCase as never,
    );

    const result = await service.execute(
      { username: authCredentialMock.username, password: "correct-password" },
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );

    expect(result).toBe(issuedSession);
    expect(deps.issueAuthSessionUseCase.execute).toHaveBeenCalledWith(
      authCredentialMock,
      { ipAddress: "127.0.0.1", userAgent: "jest" },
    );
    expect(
      deps.authCredentialsUseCase.registerFailedLogin,
    ).not.toHaveBeenCalled();
  });
});
