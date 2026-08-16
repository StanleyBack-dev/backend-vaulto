import { Inject, Injectable, Logger } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import {
  ACCOUNT_DELETION_REPOSITORY,
  type AccountDeletionRepositoryPort,
  type AccountDeletionView,
} from "@/modules/account-lifecycle/application/ports/account-deletion-repository.port";
import { AccountAuditEvent } from "@/modules/account-lifecycle/domain/enums/account-audit-event.enum";
import { AccountAuditLogEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-audit-log.entity";
import { AccountDeactivationEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deactivation.entity";
import { AccountDeletionEntity } from "@/modules/account-lifecycle/infrastructure/persistence/typeorm/entities/account-deletion.entity";
import { SubscriptionCancellationEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription-cancellation.entity";
import { CategoryEntity } from "@/modules/categories/infrastructure/persistence/typeorm/entities/category.entity";
import { CreditCardEntity } from "@/modules/credit-cards/infrastructure/persistence/typeorm/entities/credit-card.entity";
import { DebtInstallmentEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt-installment.entity";
import { DebtEntity } from "@/modules/debts/infrastructure/persistence/typeorm/entities/debt.entity";
import { FinancialGoalEntity } from "@/modules/goals/infrastructure/persistence/typeorm/entities/financial-goal.entity";
import { GoalContributionEntity } from "@/modules/goals/infrastructure/persistence/typeorm/entities/goal-contribution.entity";
import { IncomeReceiptEntity } from "@/modules/income-receipts/infrastructure/persistence/typeorm/entities/income-receipt.entity";
import { IncomeInstallmentEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income-installment.entity";
import { IncomeEntity } from "@/modules/incomes/infrastructure/persistence/typeorm/entities/income.entity";
import { DebtPaymentEntity } from "@/modules/payments/infrastructure/persistence/typeorm/entities/debt-payment.entity";
import { SupportMessageEntity } from "@/modules/support/infrastructure/persistence/typeorm/entities/support-message.entity";
import { TermsAcceptanceEntity } from "@/modules/legal/infrastructure/persistence/typeorm/entities/terms-acceptance.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface ProcessAccountDeletionsResult {
  processed: number;
}

// Runs daily via a Vercel Cron Job — see AccountDeletionsController and
// vercel.json. Permanently deletes every personal record for accounts whose
// grace period (ACCOUNT_DELETION_GRACE_PERIOD_DAYS) has expired.
//
// Deliberately NOT deleted: tb_subscriptions and tb_billing_payments (the
// user's financial relationship with Vaulto itself — kept per company
// policy, left with an idUsers pointing at a row that no longer exists)
// and tb_account_audit_log (the one record required to survive deletion).
@Injectable()
export class ProcessAccountDeletionsUseCase {
  private readonly logger = new Logger(ProcessAccountDeletionsUseCase.name);

  constructor(
    @Inject(ACCOUNT_DELETION_REPOSITORY)
    private readonly accountDeletionRepository: AccountDeletionRepositoryPort,
    private readonly dataSource: DataSource,
  ) {}

  async execute(): Promise<ProcessAccountDeletionsResult> {
    const dueDeletions =
      await this.accountDeletionRepository.findDueForExecution(new Date());

    let processed = 0;
    for (const deletion of dueDeletions) {
      const deleted = await this.deleteAccountData(deletion);
      if (deleted) {
        processed += 1;
      }
    }

    this.logger.log(
      `Account deletions job: ${processed} conta(s) excluída(s) permanentemente.`,
    );

    return { processed };
  }

  private async deleteAccountData(
    deletion: AccountDeletionView,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const user = await userRepository.findOne({
        where: { idUsers: deletion.idUsers },
      });

      if (!user) {
        return false;
      }

      await manager.getRepository(AccountAuditLogEntity).save(
        manager.getRepository(AccountAuditLogEntity).create({
          idUsers: user.idUsers,
          email: user.email,
          name: user.name,
          event: AccountAuditEvent.DELETION_EXECUTED,
        }),
      );

      const debtIds = (
        await manager
          .getRepository(DebtEntity)
          .find({ where: { idUsers: user.idUsers }, select: ["idDebt"] })
      ).map((debt) => debt.idDebt);
      const incomeIds = (
        await manager
          .getRepository(IncomeEntity)
          .find({ where: { idUsers: user.idUsers }, select: ["idIncome"] })
      ).map((income) => income.idIncome);
      const goalIds = (
        await manager.getRepository(FinancialGoalEntity).find({
          where: { idUsers: user.idUsers },
          select: ["idFinancialGoal"],
        })
      ).map((goal) => goal.idFinancialGoal);

      await manager
        .getRepository(DebtPaymentEntity)
        .delete({ idUsers: user.idUsers });
      if (debtIds.length) {
        await manager
          .getRepository(DebtInstallmentEntity)
          .delete({ idDebt: In(debtIds) });
      }
      await manager.getRepository(DebtEntity).delete({ idUsers: user.idUsers });

      await manager
        .getRepository(IncomeReceiptEntity)
        .delete({ idUsers: user.idUsers });
      if (incomeIds.length) {
        await manager
          .getRepository(IncomeInstallmentEntity)
          .delete({ idIncome: In(incomeIds) });
      }
      await manager
        .getRepository(IncomeEntity)
        .delete({ idUsers: user.idUsers });

      if (goalIds.length) {
        await manager
          .getRepository(GoalContributionEntity)
          .delete({ idFinancialGoal: In(goalIds) });
      }
      await manager
        .getRepository(FinancialGoalEntity)
        .delete({ idUsers: user.idUsers });

      await manager
        .getRepository(CategoryEntity)
        .delete({ idUsers: user.idUsers });
      await manager
        .getRepository(CreditCardEntity)
        .delete({ idUsers: user.idUsers });
      await manager
        .getRepository(SupportMessageEntity)
        .delete({ idUsers: user.idUsers });
      await manager
        .getRepository(TermsAcceptanceEntity)
        .delete({ idUsers: user.idUsers });
      await manager
        .getRepository(SubscriptionCancellationEntity)
        .delete({ idUsers: user.idUsers });
      await manager
        .getRepository(AccountDeactivationEntity)
        .delete({ idUsers: user.idUsers });
      await manager
        .getRepository(AccountDeletionEntity)
        .delete({ idUsers: user.idUsers });

      // Cascades tb_auth_credentials, tb_sessions, tb_user_page_access and
      // tb_auth_verification_codes (the only tables with a real DB-level FK).
      await userRepository.delete({ idUsers: user.idUsers });

      return true;
    });
  }
}
