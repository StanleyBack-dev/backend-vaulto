import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { MailModule } from "@/modules/mails/mail.module";
import { SessionEntity } from "@/modules/sessions/infrastructure/persistence/typeorm/entities/session.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { ACCOUNT_AUDIT_LOG_REPOSITORY } from "@/modules/account-lifecycle/application/ports/account-audit-log-repository.port";
import { ACCOUNT_DEACTIVATION_REPOSITORY } from "@/modules/account-lifecycle/application/ports/account-deactivation-repository.port";
import { ACCOUNT_DELETION_REPOSITORY } from "@/modules/account-lifecycle/application/ports/account-deletion-repository.port";
import { CancelAccountDeletionUseCase } from "@/modules/account-lifecycle/application/use-cases/cancel-account-deletion.use-case";
import { DeactivateAccountUseCase } from "@/modules/account-lifecycle/application/use-cases/deactivate-account.use-case";
import { ProcessAccountDeletionsUseCase } from "@/modules/account-lifecycle/application/use-cases/process-account-deletions.use-case";
import { RequestAccountDeletionUseCase } from "@/modules/account-lifecycle/application/use-cases/request-account-deletion.use-case";
import { AccountAuditLogEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-audit-log.entity";
import { AccountDeactivationEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deactivation.entity";
import { AccountDeletionEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deletion.entity";
import { AccountAuditLogTypeormRepository } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/repositories/account-audit-log-typeorm.repository";
import { AccountDeactivationTypeormRepository } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/repositories/account-deactivation-typeorm.repository";
import { AccountDeletionTypeormRepository } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/repositories/account-deletion-typeorm.repository";
import { AccountDeletionsController } from "@/modules/account-lifecycle/presentation/rest/controllers/account-deletions.controller";
import { AccountLifecycleResolver } from "@/modules/account-lifecycle/presentation/graphql/resolvers/account-lifecycle.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountDeactivationEntity,
      AccountDeletionEntity,
      AccountAuditLogEntity,
      UserEntity,
      SessionEntity,
    ]),
    AuthModule,
    BillingModule,
    MailModule,
  ],
  controllers: [AccountDeletionsController],
  providers: [
    DeactivateAccountUseCase,
    RequestAccountDeletionUseCase,
    CancelAccountDeletionUseCase,
    ProcessAccountDeletionsUseCase,
    AccountLifecycleResolver,
    AccountDeactivationTypeormRepository,
    AccountDeletionTypeormRepository,
    AccountAuditLogTypeormRepository,
    {
      provide: ACCOUNT_DEACTIVATION_REPOSITORY,
      useExisting: AccountDeactivationTypeormRepository,
    },
    {
      provide: ACCOUNT_DELETION_REPOSITORY,
      useExisting: AccountDeletionTypeormRepository,
    },
    {
      provide: ACCOUNT_AUDIT_LOG_REPOSITORY,
      useExisting: AccountAuditLogTypeormRepository,
    },
  ],
})
export class AccountLifecycleModule {}
