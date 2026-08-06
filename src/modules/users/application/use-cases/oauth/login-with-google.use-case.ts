import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import type { IRequestInfo } from "@/common/decorators/request-info.decorator";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { AuthCredentialsService } from "@/modules/auth/application/use-cases/auth-credentials.use-case";
import { AuthSessionResponseDto } from "@/modules/auth/presentation/graphql/dtos/session/auth-session-response.dto";
import { GoogleTokenVerifierService } from "@/modules/auth/application/use-cases/google-token-verifier.use-case";
import { IssueAuthSessionService } from "@/modules/auth/application/use-cases/issue-auth-session.use-case";
import { PasswordHasherService } from "@/modules/auth/application/use-cases/password-hasher.use-case";
import { SeedDefaultCategoriesUseCase } from "@/modules/categories/application/use-cases/create/seed-default-categories.use-case";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly googleTokenVerifierUseCase: GoogleTokenVerifierService,
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordHasherUseCase: PasswordHasherService,
    private readonly issueAuthSessionUseCase: IssueAuthSessionService,
    private readonly seedDefaultCategoriesUseCase: SeedDefaultCategoriesUseCase,
  ) {}

  async execute(
    idToken: string,
    requestInfo: IRequestInfo,
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
        : await this.createUserFromGoogleProfile(profile, requestInfo);
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
  ): Promise<AuthCredentialEntity> {
    const temporaryPassword =
      this.passwordHasherUseCase.generateTemporaryPassword();
    const passwordHash =
      await this.passwordHasherUseCase.hashPassword(temporaryPassword);

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
      });

      const savedUser = await userRepository.save(user);

      const credential = authCredentialRepository.create({
        idUsers: savedUser.idUsers,
        username: profile.email,
        passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        googleId: profile.googleId,
      });

      await authCredentialRepository.save(credential);

      return savedUser.idUsers;
    });

    await this.seedDefaultCategoriesUseCase.execute(savedUserId);

    return (await this.authCredentialsUseCase.findByUserId(savedUserId))!;
  }
}
