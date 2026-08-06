import { LoginWithGoogleUseCase } from "@/modules/users/application/use-cases/oauth/login-with-google.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";
import { userMock } from "@/modules/users/__mocks__/user.mock";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

const googleProfile = {
  googleId: "google-sub-123",
  email: "new.user@example.com",
  name: "New User",
  picture: "https://example.com/photo.jpg",
};

const requestInfo = { ipAddress: "127.0.0.1", userAgent: "jest" };
const issuedSession = { accessToken: "a", refreshToken: "r", response: {} };

function buildDeps() {
  const userRepository = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  const transactionalUserRepository = {
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => ({ ...input, idUsers: "new-user-id" })),
  };
  const transactionalCredentialRepository = {
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
  };

  const manager = {
    getRepository: jest.fn((entity: { name?: string }) =>
      entity?.name === "UserEntity" || entity === undefined
        ? transactionalUserRepository
        : transactionalCredentialRepository,
    ),
  };

  const dataSource = {
    transaction: jest.fn(async (cb: (manager: unknown) => Promise<unknown>) =>
      cb(manager),
    ),
  };

  const googleTokenVerifierUseCase = {
    verify: jest.fn().mockResolvedValue(googleProfile),
  };

  const authCredentialsUseCase = {
    findByGoogleId: jest.fn().mockResolvedValue(null),
    findByUserIdOrFail: jest.fn(),
    linkGoogleId: jest.fn(),
    ensureCredentialCanAuthenticate: jest.fn().mockResolvedValue(undefined),
    findByUserId: jest.fn(),
  };

  const passwordHasherUseCase = {
    generateTemporaryPassword: jest.fn().mockReturnValue("random-temp-pass"),
    hashPassword: jest.fn().mockResolvedValue("salt:hash"),
  };

  const issueAuthSessionUseCase = {
    execute: jest.fn().mockResolvedValue(issuedSession),
  };

  const seedDefaultCategoriesUseCase = {
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const userWelcomeEmailUseCase = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  return {
    userRepository,
    dataSource,
    googleTokenVerifierUseCase,
    authCredentialsUseCase,
    passwordHasherUseCase,
    issueAuthSessionUseCase,
    seedDefaultCategoriesUseCase,
    userWelcomeEmailUseCase,
    transactionalUserRepository,
    transactionalCredentialRepository,
  };
}

function buildService(deps: ReturnType<typeof buildDeps>) {
  return new LoginWithGoogleUseCase(
    deps.userRepository as never,
    deps.dataSource as never,
    deps.googleTokenVerifierUseCase as never,
    deps.authCredentialsUseCase as never,
    deps.passwordHasherUseCase as never,
    deps.issueAuthSessionUseCase as never,
    deps.seedDefaultCategoriesUseCase as never,
    deps.userWelcomeEmailUseCase as never,
  );
}

describe("LoginWithGoogleUseCase", () => {
  it("issues a session directly when the googleId is already linked", async () => {
    const deps = buildDeps();
    deps.authCredentialsUseCase.findByGoogleId.mockResolvedValue(
      authCredentialMock,
    );
    const service = buildService(deps);

    const result = await service.execute("id-token", requestInfo);

    expect(result).toBe(issuedSession);
    expect(deps.userRepository.findOne).not.toHaveBeenCalled();
    expect(
      deps.authCredentialsUseCase.ensureCredentialCanAuthenticate,
    ).toHaveBeenCalledWith(authCredentialMock);
    expect(deps.issueAuthSessionUseCase.execute).toHaveBeenCalledWith(
      authCredentialMock,
      requestInfo,
    );
  });

  it("links the Google account to an existing user found by email", async () => {
    const deps = buildDeps();
    deps.userRepository.findOne.mockResolvedValue(userMock);
    deps.authCredentialsUseCase.findByUserIdOrFail.mockResolvedValue(
      authCredentialMock,
    );
    const linkedCredential = {
      ...authCredentialMock,
      googleId: "google-sub-123",
    };
    deps.authCredentialsUseCase.linkGoogleId.mockResolvedValue(
      linkedCredential,
    );
    const service = buildService(deps);

    const result = await service.execute("id-token", requestInfo);

    expect(deps.authCredentialsUseCase.findByUserIdOrFail).toHaveBeenCalledWith(
      userMock.idUsers,
    );
    expect(deps.authCredentialsUseCase.linkGoogleId).toHaveBeenCalledWith(
      authCredentialMock,
      "google-sub-123",
    );
    expect(deps.issueAuthSessionUseCase.execute).toHaveBeenCalledWith(
      linkedCredential,
      requestInfo,
    );
    expect(result).toBe(issuedSession);
  });

  it("creates a new user, credential and default categories when no match exists", async () => {
    const deps = buildDeps();
    const createdCredential = {
      ...authCredentialMock,
      idUsers: "new-user-id",
      googleId: "google-sub-123",
    };
    deps.authCredentialsUseCase.findByUserId.mockResolvedValue(
      createdCredential,
    );
    const service = buildService(deps);

    const result = await service.execute("id-token", requestInfo);

    expect(deps.transactionalUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: googleProfile.name,
        email: googleProfile.email,
        urlAvatar: googleProfile.picture,
        status: true,
        group: UserGroup.USER,
      }),
    );
    expect(deps.transactionalCredentialRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsers: "new-user-id",
        username: googleProfile.email,
        passwordHash: "salt:hash",
        mustChangePassword: false,
        googleId: googleProfile.googleId,
      }),
    );
    expect(deps.seedDefaultCategoriesUseCase.execute).toHaveBeenCalledWith(
      "new-user-id",
    );
    expect(deps.userWelcomeEmailUseCase.send).toHaveBeenCalledWith({
      to: googleProfile.email,
      name: googleProfile.name,
    });
    expect(deps.authCredentialsUseCase.findByUserId).toHaveBeenCalledWith(
      "new-user-id",
    );
    expect(deps.issueAuthSessionUseCase.execute).toHaveBeenCalledWith(
      createdCredential,
      requestInfo,
    );
    expect(result).toBe(issuedSession);
  });

  it("does not fail user creation when the welcome email fails to send", async () => {
    const deps = buildDeps();
    deps.authCredentialsUseCase.findByUserId.mockResolvedValue(
      authCredentialMock,
    );
    deps.userWelcomeEmailUseCase.send.mockRejectedValue(
      new Error("mail provider down"),
    );
    const service = buildService(deps);

    const result = await service.execute("id-token", requestInfo);

    expect(result).toBe(issuedSession);
    expect(deps.issueAuthSessionUseCase.execute).toHaveBeenCalled();
  });

  it("propagates an ensureCredentialCanAuthenticate rejection without issuing a session", async () => {
    const deps = buildDeps();
    deps.authCredentialsUseCase.findByGoogleId.mockResolvedValue(
      authCredentialMock,
    );
    const rejection = new Error("inactive");
    deps.authCredentialsUseCase.ensureCredentialCanAuthenticate.mockRejectedValue(
      rejection,
    );
    const service = buildService(deps);

    await expect(service.execute("id-token", requestInfo)).rejects.toBe(
      rejection,
    );
    expect(deps.issueAuthSessionUseCase.execute).not.toHaveBeenCalled();
  });
});
