import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { GoogleTokenVerifierService } from "@/modules/auth/application/use-cases/google-token-verifier.use-case";

const verifyIdTokenMock = jest.fn();

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}));

function buildConfigService(clientId?: string) {
  return {
    get: jest.fn().mockReturnValue(clientId),
  };
}

describe("GoogleTokenVerifierService", () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
  });

  it("rejects when GOOGLE_CLIENT_ID is not configured", async () => {
    const service = new GoogleTokenVerifierService(
      buildConfigService(undefined) as never,
    );

    await expect(service.verify("some-token")).rejects.toMatchObject({
      response: { code: APP_ERRORS.auth.googleLoginNotConfigured.code },
    });
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it("rejects when the token payload is missing sub or email", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({ email_verified: true }),
    });
    const service = new GoogleTokenVerifierService(
      buildConfigService("client-id") as never,
    );

    await expect(service.verify("some-token")).rejects.toMatchObject({
      response: { code: APP_ERRORS.auth.googleTokenInvalid.code },
    });
  });

  it("rejects when the Google email is not verified", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "user@example.com",
        email_verified: false,
      }),
    });
    const service = new GoogleTokenVerifierService(
      buildConfigService("client-id") as never,
    );

    await expect(service.verify("some-token")).rejects.toMatchObject({
      response: { code: APP_ERRORS.auth.googleEmailNotVerified.code },
    });
  });

  it("wraps a verification failure from the Google client as an invalid-token error", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("bad signature"));
    const service = new GoogleTokenVerifierService(
      buildConfigService("client-id") as never,
    );

    await expect(service.verify("some-token")).rejects.toMatchObject({
      response: { code: APP_ERRORS.auth.googleTokenInvalid.code },
    });
  });

  it("returns a normalized profile for a valid, verified token", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "  User@Example.com  ",
        email_verified: true,
        name: "Jane Doe",
        picture: "https://example.com/photo.jpg",
      }),
    });
    const service = new GoogleTokenVerifierService(
      buildConfigService("client-id") as never,
    );

    const profile = await service.verify("some-token");

    expect(profile).toEqual({
      googleId: "google-sub-123",
      email: "user@example.com",
      name: "Jane Doe",
      picture: "https://example.com/photo.jpg",
    });
    expect(verifyIdTokenMock).toHaveBeenCalledWith({
      idToken: "some-token",
      audience: "client-id",
    });
  });

  it("propagates AppException instances thrown while validating the payload", async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "user@example.com",
        email_verified: false,
      }),
    });
    const service = new GoogleTokenVerifierService(
      buildConfigService("client-id") as never,
    );

    const error = await service.verify("some-token").catch((e) => e);

    expect(error).toBeInstanceOf(AppException);
  });
});
