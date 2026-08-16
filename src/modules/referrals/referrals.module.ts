import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { MailModule } from "@/modules/mails/mail.module";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { REFERRAL_REWARD_REPOSITORY } from "@/modules/referrals/application/ports/referral-reward-repository.port";
import { ApplyReferralRewardsUseCase } from "@/modules/referrals/application/use-cases/apply-referral-rewards.use-case";
import { GetMyReferralStatsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import { QualifyReferralUseCase } from "@/modules/referrals/application/use-cases/qualify-referral.use-case";
import { ReferralRewardEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-reward.entity";
import { ReferralRewardTypeormRepository } from "@/modules/referrals/infrastructure/persistence/typeorm/repositories/referral-reward-typeorm.repository";
import { ReferralRewardsController } from "@/modules/referrals/presentation/rest/controllers/referral-rewards.controller";
import { ReferralsResolver } from "@/modules/referrals/presentation/graphql/resolvers/referrals.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralRewardEntity, UserEntity]),
    AuthModule,
    BillingModule,
    MailModule,
  ],
  controllers: [ReferralRewardsController],
  providers: [
    QualifyReferralUseCase,
    ApplyReferralRewardsUseCase,
    GetMyReferralStatsUseCase,
    ReferralsResolver,
    ReferralRewardTypeormRepository,
    {
      provide: REFERRAL_REWARD_REPOSITORY,
      useExisting: ReferralRewardTypeormRepository,
    },
  ],
})
export class ReferralsModule {}
