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
  ACCOUNT_DELETION_REPOSITORY,
  type AccountDeletionRepositoryPort,
} from "@/modules/account-lifecycle/application/ports/account-deletion-repository.port";
import { AccountAuditEvent } from "@/modules/account-lifecycle/domain/enums/account-audit-event.enum";
import { AccountDeletionCancelledEmailUseCase } from "@/modules/mails/application/use-cases/account-deletion-cancelled-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class CancelAccountDeletionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_DELETION_REPOSITORY)
    private readonly accountDeletionRepository: AccountDeletionRepositoryPort,
    @Inject(ACCOUNT_AUDIT_LOG_REPOSITORY)
    private readonly accountAuditLogRepository: AccountAuditLogRepositoryPort,
    private readonly accountDeletionCancelledEmailUseCase: AccountDeletionCancelledEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(idUsers: string): Promise<void> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    const pendingDeletion =
      await this.accountDeletionRepository.findPendingByUserId(idUsers);
    if (!pendingDeletion) {
      throw AppException.from(
        APP_ERRORS.accountLifecycle.noDeletionRequestToCancel,
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

    const cancelledAt = new Date();

    await this.accountDeletionRepository.markCancelled(
      pendingDeletion.idAccountDeletion,
      cancelledAt,
    );

    await this.userRepository.update(
      { idUsers },
      { deletionRequestedAt: null },
    );

    await this.accountAuditLogRepository.record({
      idUsers,
      email: user.email,
      name: user.name,
      event: AccountAuditEvent.DELETION_CANCELLED,
    });

    await this.accountDeletionCancelledEmailUseCase.send({
      to: user.email,
      name: user.name,
    });
  }
}
