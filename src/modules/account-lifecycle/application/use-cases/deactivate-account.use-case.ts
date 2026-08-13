import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  ACCOUNT_AUDIT_LOG_REPOSITORY,
  type AccountAuditLogRepositoryPort,
} from "@/modules/account-lifecycle/application/ports/account-audit-log-repository.port";
import {
  ACCOUNT_DEACTIVATION_REPOSITORY,
  type AccountDeactivationRepositoryPort,
} from "@/modules/account-lifecycle/application/ports/account-deactivation-repository.port";
import { AccountAuditEvent } from "@/modules/account-lifecycle/domain/enums/account-audit-event.enum";
import { AccountDeactivationReason } from "@/modules/account-lifecycle/domain/enums/account-deactivation-reason.enum";
import { AccountDeactivationConfirmationEmailUseCase } from "@/modules/mails/application/use-cases/account-deactivation-confirmation-email.use-case";
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface DeactivateAccountCommand {
  reasons: AccountDeactivationReason[];
  otherReason?: string;
}

@Injectable()
export class DeactivateAccountUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_DEACTIVATION_REPOSITORY)
    private readonly accountDeactivationRepository: AccountDeactivationRepositoryPort,
    @Inject(ACCOUNT_AUDIT_LOG_REPOSITORY)
    private readonly accountAuditLogRepository: AccountAuditLogRepositoryPort,
    private readonly accountDeactivationConfirmationEmailUseCase: AccountDeactivationConfirmationEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async execute(
    idUsers: string,
    command: DeactivateAccountCommand,
  ): Promise<void> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    if (!command.reasons.length) {
      throw AppException.from(
        APP_ERRORS.accountLifecycle.deactivationReasonRequired,
        undefined,
      );
    }

    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      throw AppException.from(
        APP_ERRORS.authorization.authenticatedUserNotFound,
        undefined,
      );
    }

    if (!user.status || user.inactivatedAt) {
      throw AppException.from(
        APP_ERRORS.accountLifecycle.accountAlreadyInactive,
        undefined,
      );
    }

    const deactivatedAt = new Date();

    await this.accountDeactivationRepository.create({
      idUsers,
      reasons: command.reasons,
      otherReason: command.otherReason,
      deactivatedAt,
    });

    await this.userRepository.update(
      { idUsers },
      { status: false, inactivatedAt: deactivatedAt },
    );

    await this.sessionRepository.update(
      { idUsers, sessionActive: true },
      { sessionActive: false, revokedAt: deactivatedAt },
    );

    await this.accountAuditLogRepository.record({
      idUsers,
      email: user.email,
      name: user.name,
      event: AccountAuditEvent.DEACTIVATED,
    });

    await this.accountDeactivationConfirmationEmailUseCase.send({
      to: user.email,
      name: user.name,
    });
  }
}
