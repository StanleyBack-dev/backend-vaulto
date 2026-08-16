import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import type { IRequestInfo } from "@/common/decorators/request-info.decorator";
import { sanitizeSensitiveData } from "@/common/security/sanitize-sensitive-data";
import { generateUniqueReferralCode } from "@/common/utils/referral-code.util";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { CreateDefaultSubscriptionUseCase } from "@/modules/billing/application/use-cases/create/create-default-subscription.use-case";
import { GoogleTokenVerifierService } from "@/modules/auth/application/use-cases/google-token-verifier.use-case";
import { IssueAuthSessionService } from "@/modules/auth/application/use-cases/issue-auth-session.use-case";
import { PasswordHasherService } from "@/modules/auth/application/use-cases/password-hasher.use-case";
import { SeedDefaultCategoriesUseCase } from "@/modules/categories/application/use-cases/create/seed-default-categories.use-case";
import { UserWelcomeEmailUseCase } from "@/modules/mails/application/use-cases/user-welcome-email.use-case";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class LoginWithGoogleUseCase {
  private readonly logger = new Logger(LoginWithGoogleUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly googleTokenVerifierUseCase: GoogleTokenVerifierService,
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordHasherUseCase: PasswordHasherService,
    private readonly issueAuthSessionUseCase: IssueAuthSessionService,
    private readonly seedDefaultCategoriesUseCase: SeedDefaultCategoriesUseCase,
    private readonly userWelcomeEmailUseCase: UserWelcomeEmailUseCase,
    private readonly createDefaultSubscriptionUseCase: CreateDefaultSubscriptionUseCase,
  ) {}

  async execute(
    idToken: string,
    requestInfo: IRequestInfo,
    referralCode?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    response: AuthSessionResponseDto;
  }> {
    const profile = await this.googleTokenVerifierUseCase.verify(idToken);

    let credential = await this.authCredentialsUseCase.findByGoogleId(
      profile.googleId,
    );

    if (!credential) {
      const existingUser = await this.userRepository.findOne({
        where: { email: profile.email },
      });

      credential = existingUser
        ? await this.linkGoogleToExistingUser(existingUser.idUsers, profile)
        : await this.createUserFromGoogleProfile(
            profile,
            requestInfo,
            referralCode,
          );
    }

    await this.authCredentialsUseCase.ensureCredentialCanAuthenticate(
      credential,
    );

    return this.issueAuthSessionUseCase.execute(credential, requestInfo);
  }

  private async linkGoogleToExistingUser(
    idUsers: string,
    profile: { googleId: string },
  ): Promise<AuthCredentialEntity> {
    const existingCredential =
      await this.authCredentialsUseCase.findByUserIdOrFail(idUsers);

    return this.authCredentialsUseCase.linkGoogleId(
      existingCredential,
      profile.googleId,
    );
  }

  private async createUserFromGoogleProfile(
    profile: {
      googleId: string;
      email: string;
      name: string;
      picture?: string;
    },
    requestInfo: IRequestInfo,
    referralCode?: string,
  ): Promise<AuthCredentialEntity> {
    const temporaryPassword =
      this.passwordHasherUseCase.generateTemporaryPassword();
    const passwordHash =
      await this.passwordHasherUseCase.hashPassword(temporaryPassword);
    const newReferralCode = await generateUniqueReferralCode((candidate) =>
      this.userRepository
        .count({ where: { referralCode: candidate } })
        .then((count) => count > 0),
    );
    const referredByUserId = await this.resolveReferrerId(referralCode);

    const savedUserId = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const authCredentialRepository =
        manager.getRepository(AuthCredentialEntity);

      const user = userRepository.create({
        name: profile.name,
        email: profile.email,
        urlAvatar: profile.picture,
        status: true,
        group: UserGroup.USER,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        referralCode: newReferralCode,
        referredByUserId,
      });

      const savedUser = await userRepository.save(user);

      const credential = authCredentialRepository.create({
        idUsers: savedUser.idUsers,
        username: profile.email,
        passwordHash,
        mustChangePassword: false,
        onboardingTourCompleted: false,
        failedLoginAttempts: 0,
        googleId: profile.googleId,
      });

      await authCredentialRepository.save(credential);

      return savedUser.idUsers;
    });

    await this.seedDefaultCategoriesUseCase.execute(savedUserId);
    await this.createDefaultSubscriptionUseCase.execute(savedUserId);
    await this.sendWelcomeEmailSafely({
      to: profile.email,
      name: profile.name,
    });

    return (await this.authCredentialsUseCase.findByUserId(savedUserId))!;
  }

  // Invalid/unknown codes are silently ignored — a bad ?ref= param in the
  // URL shouldn't ever block someone from creating an account.
  private async resolveReferrerId(
    referralCode?: string,
  ): Promise<string | undefined> {
    if (!referralCode) {
      return undefined;
    }

    const referrer = await this.userRepository.findOne({
      where: { referralCode },
    });

    return referrer?.idUsers;
  }

  private async sendWelcomeEmailSafely(input: {
    to: string;
    name: string;
  }): Promise<void> {
    try {
      await this.userWelcomeEmailUseCase.send(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha no envio de email de boas-vindas para ${input.to}: ${sanitizeSensitiveData(message)}`,
      );
    }
  }
}
