import { HttpStatus } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { authCredentialMock } from "@/modules/auth/__mocks__/auth-credential.mock";
import { userMock } from "@/modules/users/__mocks__/user.mock";

describe("AuthCredentialsService", () => {
  describe("ensureCredentialCanAuthenticate", () => {
    it("rejects an inactive user", async () => {
      const service = new AuthCredentialsService({} as never, {} as never);

      await expect(
        service.ensureCredentialCanAuthenticate({
          ...authCredentialMock,
          user: { ...userMock, status: false },
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: { code: APP_ERRORS.auth.inactiveUser.code },
      });
    });

    it("rejects a user with an inactivatedAt date even if status is still true", async () => {
      const service = new AuthCredentialsService({} as never, {} as never);

      await expect(
        service.ensureCredentialCanAuthenticate({
          ...authCredentialMock,
          user: { ...userMock, status: true, inactivatedAt: new Date() },
        }),
      ).rejects.toMatchObject({
        response: { code: APP_ERRORS.auth.inactiveUser.code },
      });
    });

    it("rejects a credential locked until a future date", async () => {
      const service = new AuthCredentialsService({} as never, {} as never);
      const lockUntil = new Date(Date.now() + 60_000);

      await expect(
        service.ensureCredentialCanAuthenticate({
          ...authCredentialMock,
          lockUntil,
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: { code: APP_ERRORS.auth.credentialLocked.code },
      });
    });

    it("allows a credential whose lock has already expired", async () => {
      const service = new AuthCredentialsService({} as never, {} as never);
      const lockUntil = new Date(Date.now() - 60_000);

      await expect(
        service.ensureCredentialCanAuthenticate({
          ...authCredentialMock,
          lockUntil,
        }),
      ).resolves.toBeUndefined();
    });

    it("allows an active, unlocked credential", async () => {
      const service = new AuthCredentialsService({} as never, {} as never);

      await expect(
        service.ensureCredentialCanAuthenticate(authCredentialMock),
      ).resolves.toBeUndefined();
    });
  });

  describe("registerFailedLogin", () => {
    it("only increments the counter below the 5-attempt threshold", async () => {
      const authCredentialRepository = {
        update: jest.fn().mockResolvedValue({}),
      };
      const service = new AuthCredentialsService(
        authCredentialRepository as never,
        {} as never,
      );

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
      const service = new AuthCredentialsService(
        authCredentialRepository as never,
        {} as never,
      );

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
      const service = new AuthCredentialsService(
        authCredentialRepository as never,
        {} as never,
      );

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
      const service = new AuthCredentialsService(
        authCredentialRepository as never,
        {} as never,
      );

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
      const service = new AuthCredentialsService(
        authCredentialRepository as never,
        {} as never,
      );

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
      const service = new AuthCredentialsService(
        authCredentialRepository as never,
        {} as never,
      );

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
