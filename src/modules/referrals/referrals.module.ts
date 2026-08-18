import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { MailModule } from "@/modules/mails/mail.module";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { REFERRAL_CREDIT_REPOSITORY } from "@/modules/referrals/application/ports/referral-credit-repository.port";
import { REFERRAL_WITHDRAWAL_REPOSITORY } from "@/modules/referrals/application/ports/referral-withdrawal-repository.port";
import { ClawbackReferralCreditUseCase } from "@/modules/referrals/application/use-cases/clawback-referral-credit.use-case";
import { GetMyReferralStatsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import { GetMyReferralWithdrawalsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-withdrawals.use-case";
import { LookupReferralWithdrawalPixKeyUseCase } from "@/modules/referrals/application/use-cases/lookup-referral-withdrawal-pix-key.use-case";
import { PromoteReferralCreditsUseCase } from "@/modules/referrals/application/use-cases/promote-referral-credits.use-case";
import { QualifyReferralUseCase } from "@/modules/referrals/application/use-cases/qualify-referral.use-case";
import { RequestReferralWithdrawalUseCase } from "@/modules/referrals/application/use-cases/request-referral-withdrawal.use-case";
import { ReferralCreditEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-credit.entity";
import { ReferralWithdrawalEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-withdrawal.entity";
import { ReferralCreditTypeormRepository } from "@/modules/referrals/infrastructure/persistence/typeorm/repositories/referral-credit-typeorm.repository";
import { ReferralWithdrawalTypeormRepository } from "@/modules/referrals/infrastructure/persistence/typeorm/repositories/referral-withdrawal-typeorm.repository";
import { ReferralCreditsController } from "@/modules/referrals/presentation/rest/controllers/referral-credits.controller";
import { ReferralsResolver } from "@/modules/referrals/presentation/graphql/resolvers/referrals.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralCreditEntity,
      ReferralWithdrawalEntity,
      UserEntity,
    ]),
    AuthModule,
    BillingModule,
    MailModule,
  ],
  controllers: [ReferralCreditsController],
  providers: [
    QualifyReferralUseCase,
    ClawbackReferralCreditUseCase,
    PromoteReferralCreditsUseCase,
    RequestReferralWithdrawalUseCase,
    LookupReferralWithdrawalPixKeyUseCase,
    GetMyReferralStatsUseCase,
    GetMyReferralWithdrawalsUseCase,
    ReferralsResolver,
    ReferralCreditTypeormRepository,
    ReferralWithdrawalTypeormRepository,
    {
      provide: REFERRAL_CREDIT_REPOSITORY,
      useExisting: ReferralCreditTypeormRepository,
    },
    {
      provide: REFERRAL_WITHDRAWAL_REPOSITORY,
      useExisting: ReferralWithdrawalTypeormRepository,
    },
  ],
})
export class ReferralsModule {}
