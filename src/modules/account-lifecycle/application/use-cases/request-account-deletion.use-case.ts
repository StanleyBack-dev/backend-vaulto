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
import { ACCOUNT_DELETION_GRACE_PERIOD_DAYS } from "@/modules/account-lifecycle/domain/constants/account-deletion.constant";
import { AccountDeletionReason } from "@/modules/account-lifecycle/domain/enums/account-deletion-reason.enum";
import {
  SUBSCRIPTION_REPOSITORY,
  type SubscriptionRepositoryPort,
} from "@/modules/billing/application/ports/subscription-repository.port";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";
import { SubscriptionPlan } from "@/modules/billing/domain/enums/subscription-plan.enum";
import { CancelSubscriptionUseCase } from "@/modules/billing/application/use-cases/update/cancel-subscription.use-case";
import { AccountDeletionRequestedEmailUseCase } from "@/modules/mails/application/use-cases/account-deletion-requested-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface RequestAccountDeletionCommand {
  reasons: AccountDeletionReason[];
  otherReason?: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RequestAccountDeletionUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_DELETION_REPOSITORY)
    private readonly accountDeletionRepository: AccountDeletionRepositoryPort,
    @Inject(ACCOUNT_AUDIT_LOG_REPOSITORY)
    private readonly accountAuditLogRepository: AccountAuditLogRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly accountDeletionRequestedEmailUseCase: AccountDeletionRequestedEmailUseCase,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    command: RequestAccountDeletionCommand,
  ): Promise<void> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    if (!command.reasons.length) {
      throw AppException.from(
        APP_ERRORS.accountLifecycle.deletionReasonRequired,
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

    const pendingDeletion =
      await this.accountDeletionRepository.findPendingByUserId(idUsers);
    if (pendingDeletion) {
      throw AppException.from(
        APP_ERRORS.accountLifecycle.deletionAlreadyRequested,
        undefined,
      );
    }

    const requestedAt = new Date();
    const scheduledFor = new Date(
      requestedAt.getTime() + ACCOUNT_DELETION_GRACE_PERIOD_DAYS * DAY_IN_MS,
    );

    await this.accountDeletionRepository.create({
      idUsers,
      email: user.email,
      reasons: command.reasons,
      otherReason: command.otherReason,
      requestedAt,
      scheduledFor,
    });

    await this.userRepository.update(
      { idUsers },
      { deletionRequestedAt: requestedAt },
    );

    await this.cancelActiveSubscriptionIfAny(idUsers);

    await this.accountAuditLogRepository.record({
      idUsers,
      email: user.email,
      name: user.name,
      event: AccountAuditEvent.DELETION_REQUESTED,
    });

    await this.accountDeletionRequestedEmailUseCase.send({
      to: user.email,
      name: user.name,
      scheduledFor,
    });
  }

  private async cancelActiveSubscriptionIfAny(idUsers: string): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findByUserId(idUsers);

    const hasCancelableSubscription =
      subscription &&
      subscription.plan === SubscriptionPlan.PRO &&
      !subscription.cancelAtPeriodEnd;

    if (!hasCancelableSubscription) {
      return;
    }

    await this.cancelSubscriptionUseCase.execute(idUsers, {
      reasons: [CancellationReason.OTHER],
      otherReason: "Conta em processo de exclusão a pedido do usuário.",
    });
  }
}
