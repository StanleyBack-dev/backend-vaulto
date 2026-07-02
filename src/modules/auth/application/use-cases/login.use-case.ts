import { Injectable } from "@nestjs/common";
import { CreateSessionUseCase } from "@/modules/sessions/application/use-cases/create/create-session.use-case";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { LoginInputDto } from "@/modules/auth/presentation/graphql/dtos/login/login-input.dto";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { AuthCredentialsService } from "./auth-credentials.use-case";
import { AuthTokensService } from "./auth-tokens.use-case";
import { PasswordHasherService } from "./password-hasher.use-case";

interface SessionRequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordHasherUseCase: PasswordHasherService,
    private readonly authTokensUseCase: AuthTokensService,
    private readonly createSessionUseCase: CreateSessionUseCase,
  ) {}

  async execute(
    input: LoginInputDto,
    requestInfo: SessionRequestInfo,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSessionResponseDto;
  }> {
    const credential = await this.authCredentialsUseCase.findByUsername(
      input.username,
    );

    if (!credential) {
      throw AppException.from(APP_ERRORS.auth.invalidCredentials, undefined);
    }

    await this.authCredentialsUseCase.ensureCredentialCanAuthenticate(
      credential,
    );

    const passwordMatches = await this.passwordHasherUseCase.verifyPassword(
      input.password,
      credential.passwordHash,
    );

    if (!passwordMatches) {
      await this.authCredentialsUseCase.registerFailedLogin(credential);
      throw AppException.from(APP_ERRORS.auth.invalidCredentials, undefined);
    }

    const accessToken = this.authTokensUseCase.signAccessToken(
      credential.user,
      credential.username,
    );
    const refreshToken = this.authTokensUseCase.signRefreshToken(
      credential.user,
      credential.username,
    );

    await this.createSessionUseCase.execute({
      idUsers: credential.idUsers,
      refreshToken,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      refreshTokenExpiresAt: new Date(
        Date.now() + this.authTokensUseCase.getRefreshTokenMaxAgeMs(),
      ),
      lastUsedAt: new Date(),
      sessionActive: true,
    });

    await this.authCredentialsUseCase.registerSuccessfulLogin(credential);

    return {
      accessToken,
      refreshToken,
      response: {
        authenticated: true,
        mustChangePassword: credential.mustChangePassword,
        user: {
          idUsers: credential.user.idUsers,
          name: credential.user.name,
          email: credential.user.email,
          username: credential.username,
          group: credential.user.group,
          status: credential.user.status,
          urlAvatar: credential.user.urlAvatar,
        },
      },
    };
  }
}




