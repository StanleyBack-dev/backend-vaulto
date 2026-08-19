import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AccountAuditEvent } from "@/modules/account-lifecycle/domain/enums/account-audit-event.enum";
import { AccountAuditLogEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-audit-log.entity";
import { AccountDeactivationEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deactivation.entity";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { AccountReactivationWelcomeBackEmailUseCase } from "@/modules/mails/application/use-cases/account-reactivation-welcome-back-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

interface ProvisionCredentialInput {
  idUsers: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class AuthCredentialsService {
  constructor(
    @InjectRepository(AuthCredentialEntity)
    private readonly authCredentialRepository: Repository<AuthCredentialEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AccountDeactivationEntity)
    private readonly accountDeactivationRepository: Repository<AccountDeactivationEntity>,
    @InjectRepository(AccountAuditLogEntity)
    private readonly accountAuditLogRepository: Repository<AccountAuditLogEntity>,
    private readonly accountReactivationWelcomeBackEmailUseCase: AccountReactivationWelcomeBackEmailUseCase,
  ) {}

  async findByUsername(username: string): Promise<AuthCredentialEntity | null> {
    return this.authCredentialRepository.findOne({
      where: { username },
      relations: ["user"],
    });
  }

  async findByUserId(idUsers: string): Promise<AuthCredentialEntity | null> {
    return this.authCredentialRepository.findOne({
      where: { idUsers },
      relations: ["user"],
    });
  }

  async findByGoogleId(googleId: string): Promise<AuthCredentialEntity | null> {
    return this.authCredentialRepository.findOne({
      where: { googleId },
      relations: ["user"],
    });
  }

  async findByUserIdOrFail(idUsers: string): Promise<AuthCredentialEntity> {
    const credential = await this.findByUserId(idUsers);

    if (!credential) {
      throw AppException.from(
        APP_ERRORS.auth.credentialNotFoundForUser,
        undefined,
      );
    }

    return credential;
  }

  async provisionCredential(
    input: ProvisionCredentialInput,
  ): Promise<AuthCredentialEntity> {
    const user = await this.userRepository.findOne({
      where: { idUsers: input.idUsers },
    });

    if (!user) {
      throw AppException.from(
        APP_ERRORS.auth.credentialProvisionUserNotFound,
        undefined,
      );
    }

    const existingUserCredential = await this.findByUserId(input.idUsers);
    if (existingUserCredential) {
      throw AppException.from(
        APP_ERRORS.auth.credentialAlreadyExistsForUser,
        undefined,
      );
    }

    const existingUsername = await this.authCredentialRepository.findOne({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw AppException.from(APP_ERRORS.auth.duplicateUsername, undefined);
    }

    const credential = this.authCredentialRepository.create({
      idUsers: input.idUsers,
      username: input.username,
      passwordHash: input.passwordHash,
      mustChangePassword: true,
      onboardingTourCompleted: false,
      temporaryPasswordCreatedAt: new Date(),
      failedLoginAttempts: 0,
    });

    return this.authCredentialRepository.save(credential);
  }

  // Kept for callers (e.g. Google login) where identity is already proven
  // by the time this runs, so reactivating a self-deactivated account here
  // is safe.
  async ensureCredentialCanAuthenticate(
    credential: AuthCredentialEntity,
  ): Promise<void> {
    await this.assertNotLocked(credential);
    await this.ensureAccountActiveOrReactivate(credential);
  }

  async assertNotLocked(credential: AuthCredentialEntity): Promise<void> {
    if (credential.lockUntil && credential.lockUntil > new Date()) {
      throw AppException.from(APP_ERRORS.auth.credentialLocked, undefined);
    }
  }

  // Only call this AFTER the caller has proven the requester owns the
  // account (password verified, or an OAuth provider already vouched for
  // them) — a self-deactivated account is reactivated automatically here,
  // and that must never happen from an unauthenticated probe. Accounts
  // deactivated by an admin (no open AccountDeactivationEntity row) stay
  // blocked either way.
  async ensureAccountActiveOrReactivate(
    credential: AuthCredentialEntity,
  ): Promise<void> {
    const { user } = credential;

    if (user.status && !user.inactivatedAt) {
      return;
    }

    const reactivated = await this.tryReactivateSelfDeactivation(user);
    if (!reactivated) {
      throw AppException.from(APP_ERRORS.auth.inactiveUser, undefined);
    }
  }

  private async tryReactivateSelfDeactivation(
    user: UserEntity,
  ): Promise<boolean> {
    const openDeactivation = await this.accountDeactivationRepository.findOne({
      where: { idUsers: user.idUsers, reactivatedAt: IsNull() },
      order: { deactivatedAt: "DESC" },
    });

    if (!openDeactivation) {
      return false;
    }

    const reactivatedAt = new Date();

    await this.userRepository.update(
      { idUsers: user.idUsers },
      { status: true, inactivatedAt: null },
    );
    // The caller (LoginService) issues the session from this same in-memory
    // `user` object right after — without this, the response would still
    // report the pre-reactivation status even though the DB is correct.
    user.status = true;
    user.inactivatedAt = null;
    await this.accountDeactivationRepository.update(
      { idAccountDeactivation: openDeactivation.idAccountDeactivation },
      { reactivatedAt },
    );
    await this.accountAuditLogRepository.save(
      this.accountAuditLogRepository.create({
        idUsers: user.idUsers,
        email: user.email,
        name: user.name,
        event: AccountAuditEvent.REACTIVATED,
      }),
    );

    await this.accountReactivationWelcomeBackEmailUseCase.send({
      to: user.email,
      name: user.name,
    });

    return true;
  }

  async registerFailedLogin(credential: AuthCredentialEntity): Promise<void> {
    const newAttempts = credential.failedLoginAttempts + 1;

    if (newAttempts >= 5) {
      await this.authCredentialRepository.update(
        { idAuthCredentials: credential.idAuthCredentials },
        {
          failedLoginAttempts: 0,
          lockUntil: new Date(Date.now() + 15 * 60 * 1000),
        },
      );
    } else {
      await this.authCredentialRepository.update(
        { idAuthCredentials: credential.idAuthCredentials },
        { failedLoginAttempts: newAttempts },
      );
    }
  }

  async registerSuccessfulLogin(
    credential: AuthCredentialEntity,
  ): Promise<void> {
    await this.authCredentialRepository.update(
      { idAuthCredentials: credential.idAuthCredentials },
      {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
      },
    );
  }

  async linkGoogleId(
    credential: AuthCredentialEntity,
    googleId: string,
  ): Promise<AuthCredentialEntity> {
    await this.authCredentialRepository.update(
      { idAuthCredentials: credential.idAuthCredentials },
      { googleId },
    );

    return (await this.findByUserId(credential.idUsers))!;
  }

  async completeOnboardingTour(idUsers: string): Promise<void> {
    await this.authCredentialRepository.update(
      { idUsers },
      { onboardingTourCompleted: true },
    );
  }

  async acceptTermsOfUse(
    idUsers: string,
    acceptedAt: Date,
    termsVersion: string,
  ): Promise<void> {
    await this.authCredentialRepository.update(
      { idUsers },
      { termsAcceptedAt: acceptedAt, termsAcceptedVersion: termsVersion },
    );
  }

  async updatePassword(
    credential: AuthCredentialEntity,
    passwordHash: string,
  ): Promise<AuthCredentialEntity> {
    await this.authCredentialRepository.update(
      { idAuthCredentials: credential.idAuthCredentials },
      {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    );

    return (await this.findByUserId(credential.idUsers))!;
  }
}
