import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleTokenVerifierService {
  private client?: OAuth2Client;

  constructor(private readonly configService: ConfigService) {}

  async verify(idToken: string): Promise<GoogleProfile> {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");

    if (!clientId) {
      throw AppException.from(
        APP_ERRORS.auth.googleLoginNotConfigured,
        undefined,
      );
    }

    try {
      const ticket = await this.getClient(clientId).verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw AppException.from(APP_ERRORS.auth.googleTokenInvalid, undefined);
      }

      if (!payload.email_verified) {
        throw AppException.from(
          APP_ERRORS.auth.googleEmailNotVerified,
          undefined,
        );
      }

      return {
        googleId: payload.sub,
        email: payload.email.trim().toLowerCase(),
        name: payload.name ?? payload.email,
        picture: payload.picture,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      throw AppException.from(APP_ERRORS.auth.googleTokenInvalid, undefined);
    }
  }

  private getClient(clientId: string): OAuth2Client {
    if (!this.client) {
      this.client = new OAuth2Client(clientId);
    }

    return this.client;
  }
}
