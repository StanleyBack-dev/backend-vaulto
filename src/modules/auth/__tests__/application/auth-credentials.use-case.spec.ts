import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";
import { userMock } from "@/modules/users/__mocks__/user.mock";

function buildService(overrides?: {
  authCredentialRepository?: unknown;
  userRepository?: unknown;
  accountDeactivationRepository?: unknown;
  accountAuditLogRepository?: unknown;
  accountReactivationWelcomeBackEmailUseCase?: unknown;
}) {
  return new AuthCredentialsService(
    (overrides?.authCredentialRepository ?? {}) as never,
    (overrides?.userRepository ?? {}) as never,
    (overrides?.accountDeactivationRepository ?? {
      findOne: jest.fn().mockResolvedValue(null),
    }) as never,
    (overrides?.accountAuditLogRepository ?? {}) as never,
    (overrides?.accountReactivationWelcomeBackEmailUseCase ?? {
      send: jest.fn().mockResolvedValue(undefined),
    }) as never,
  );
}

describe("AuthCredentialsService", () => {
  describe("assertNotLocked", () => {
    it("rejects a credential locked until a future date", async () => {
      const service = buildService();
      const lockUntil = new Date(Date.now() + 60_000);

      await expect(
        service.assertNotLocked({ ...authCredentialMock, lockUntil }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: { code: APP_ERRORS.auth.credentialLocked.code },
      });
    });

    it("allows a credential whose lock has already expired", async () => {
      const service = buildService();
      const lockUntil = new Date(Date.now() - 60_000);

      await expect(
        service.assertNotLocked({ ...authCredentialMock, lockUntil }),
      ).resolves.toBeUndefined();
    });

    it("allows an unlocked credential", async () => {
      const service = buildService();

      await expect(
        service.assertNotLocked(authCredentialMock),
      ).resolves.toBeUndefined();
    });
  });

  describe("ensureAccountActiveOrReactivate", () => {
    it("allows an active user", async () => {
      const service = buildService();

      await expect(
        service.ensureAccountActiveOrReactivate(authCredentialMock),
      ).resolves.toBeUndefined();
    });

    it("rejects an inactive user with no open self-deactivation record (admin-deactivated)", async () => {
      const accountDeactivationRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = buildService({ accountDeactivationRepository });

      await expect(
        service.ensureAccountActiveOrReactivate({
          ...authCredentialMock,
          user: { ...userMock, status: false },
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: { code: APP_ERRORS.auth.inactiveUser.code },
      });
    });

    it("rejects a user with an inactivatedAt date even if status is still true, when there's no open self-deactivation record", async () => {
      const accountDeactivationRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = buildService({ accountDeactivationRepository });

      await expect(
        service.ensureAccountActiveOrReactivate({
          ...authCredentialMock,
          user: { ...userMock, status: true, inactivatedAt: new Date() },
        }),
      ).rejects.toMatchObject({
        response: { code: APP_ERRORS.auth.inactiveUser.code },
      });
    });

    it("reactivates the account when there's an open self-deactivation record", async () => {
      const openDeactivation = {
        idAccountDeactivation: "deactivation-1",
        reactivatedAt: null,
      };
      const userRepository = { update: jest.fn().mockResolvedValue({}) };
      const accountDeactivationRepository = {
        findOne: jest.fn().mockResolvedValue(openDeactivation),
        update: jest.fn().mockResolvedValue({}),
      };
      const accountAuditLogRepository = {
        create: jest.fn().mockImplementation((payload) => payload),
        save: jest.fn().mockResolvedValue({}),
      };
      const accountReactivationWelcomeBackEmailUseCase = {
        send: jest.fn().mockResolvedValue(undefined),
      };
      const service = buildService({
        userRepository,
        accountDeactivationRepository,
        accountAuditLogRepository,
        accountReactivationWelcomeBackEmailUseCase,
      });
      const credential = {
        ...authCredentialMock,
        user: { ...userMock, status: false, inactivatedAt: new Date() },
      };

      await expect(
        service.ensureAccountActiveOrReactivate(credential),
      ).resolves.toBeUndefined();

      expect(userRepository.update).toHaveBeenCalledWith(
        { idUsers: userMock.idUsers },
        { status: true, inactivatedAt: null },
      );
      expect(accountDeactivationRepository.update).toHaveBeenCalledWith(
        { idAccountDeactivation: "deactivation-1" },
        { reactivatedAt: expect.any(Date) },
      );
      expect(accountAuditLogRepository.save).toHaveBeenCalled();
      expect(
        accountReactivationWelcomeBackEmailUseCase.send,
      ).toHaveBeenCalledWith({ to: userMock.email, name: userMock.name });

      // The in-memory user object must also flip, since LoginService issues
      // the session from this same reference right after — a DB-only
      // update would leave the login response reporting a stale status.
      expect(credential.user.status).toBe(true);
      expect(credential.user.inactivatedAt).toBeNull();
    });
  });

  describe("registerFailedLogin", () => {
    it("only increments the counter below the 5-attempt threshold", async () => {
      const authCredentialRepository = {
        update: jest.fn().mockResolvedValue({}),
      };
      const service = buildService({ authCredentialRepository });

      await service.registerFailedLogin({
        ...authCredentialMock,
        failedLoginAttempts: 2,
      });

      expect(authCredentialRepository.update).toHaveBeenCalledWith(
        { idAuthCredentials: authCredentialMock.idAuthCredentials },
        { failedLoginAttempts: 3 },
      );
    });

    it("locks the credential for 15 minutes on reaching the 5th failed attempt", async () => {
      const authCredentialRepository = {
        update: jest.fn().mockResolvedValue({}),
      };
      const service = buildService({ authCredentialRepository });

      const before = Date.now();
      await service.registerFailedLogin({
        ...authCredentialMock,
        failedLoginAttempts: 4,
      });

      expect(authCredentialRepository.update).toHaveBeenCalledTimes(1);
      const [criteria, patch] = authCredentialRepository.update.mock
        .calls[0] as [
        Record<string, unknown>,
        { failedLoginAttempts: number; lockUntil: Date },
      ];
      expect(criteria).toEqual({
        idAuthCredentials: authCredentialMock.idAuthCredentials,
      });
      expect(patch.failedLoginAttempts).toBe(0);
      expect(patch.lockUntil.getTime()).toBeGreaterThanOrEqual(
        before + 15 * 60 * 1000 - 1000,
      );
    });
  });

  describe("registerSuccessfulLogin", () => {
    it("resets the failed-attempts counter and clears any lock", async () => {
      const authCredentialRepository = {
        update: jest.fn().mockResolvedValue({}),
      };
      const service = buildService({ authCredentialRepository });

      await service.registerSuccessfulLogin(authCredentialMock);

      expect(authCredentialRepository.update).toHaveBeenCalledWith(
        { idAuthCredentials: authCredentialMock.idAuthCredentials },
        expect.objectContaining({ failedLoginAttempts: 0, lockUntil: null }),
      );
    });
  });

  describe("findByUserIdOrFail", () => {
    it("throws when no credential exists for the given user", async () => {
      const authCredentialRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      const service = buildService({ authCredentialRepository });

      await expect(
        service.findByUserIdOrFail("missing-user"),
      ).rejects.toBeInstanceOf(AppException);
    });
  });

  describe("findByGoogleId", () => {
    it("looks up the credential by googleId with the user relation loaded", async () => {
      const authCredentialRepository = {
        findOne: jest.fn().mockResolvedValue(authCredentialMock),
      };
      const service = buildService({ authCredentialRepository });

      const result = await service.findByGoogleId("google-sub-123");

      expect(authCredentialRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: "google-sub-123" },
        relations: ["user"],
      });
      expect(result).toBe(authCredentialMock);
    });
  });

  describe("linkGoogleId", () => {
    it("persists the googleId and returns the refreshed credential", async () => {
      const authCredentialRepository = {
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue({
          ...authCredentialMock,
          googleId: "google-sub-123",
        }),
      };
      const service = buildService({ authCredentialRepository });

      const result = await service.linkGoogleId(
        authCredentialMock,
        "google-sub-123",
      );

      expect(authCredentialRepository.update).toHaveBeenCalledWith(
        { idAuthCredentials: authCredentialMock.idAuthCredentials },
        { googleId: "google-sub-123" },
      );
      expect(result.googleId).toBe("google-sub-123");
    });
  });
});
