import { Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AuthCredentialsService } from "../auth-credentials.use-case";
import { PasswordHasherService } from "../password-hasher.use-case";
import { PasswordRecoveryCodesService } from "./password-recovery-codes.use-case";

@Injectable()
export class ResetPasswordWithRecoveryService {
  constructor(
    private readonly passwordRecoveryCodesUseCase: PasswordRecoveryCodesService,
    private readonly authCredentialsUseCase: AuthCredentialsService,
    private readonly passwordHasherUseCase: PasswordHasherService,
  ) {}

  async execute(recoveryToken: string, newPassword: string): Promise<void> {
    const activeRecovery =
      await this.passwordRecoveryCodesUseCase.findByResetToken(recoveryToken);

    if (!activeRecovery) {
      throw AppException.from(
        APP_ERRORS.auth.passwordRecoveryNotAllowed,
        undefined,
      );
    }

    const credential = await this.authCredentialsUseCase.findByUserIdOrFail(
      activeRecovery.idUsers,
    );

    if (!credential.user.status || credential.user.inactivatedAt) {
      throw AppException.from(APP_ERRORS.auth.inactiveUser, undefined);
    }

    const nextPasswordHash =
      await this.passwordHasherUseCase.hashPassword(newPassword);

    await this.authCredentialsUseCase.updatePassword(
      credential,
      nextPasswordHash,
    );
    await this.passwordRecoveryCodesUseCase.consume(activeRecovery);
  }
}
