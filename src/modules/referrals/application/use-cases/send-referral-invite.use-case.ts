import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { ReferralInviteEmailUseCase } from "@/modules/mails/application/use-cases/referral-invite-email.use-case";
import { GetMyReferralStatsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import { ReferralInviteEntity } from "@/modules/referrals/infrastructure/persistence/typeorm/entities/referral-invite.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

// Sends the email first and only records the invite once it's actually
// out — recording it up front would permanently block a retry for a
// referrer whose first attempt failed on a transient mail provider error.
@Injectable()
export class SendReferralInviteUseCase {
  constructor(
    @InjectRepository(ReferralInviteEntity)
    private readonly referralInviteRepository: Repository<ReferralInviteEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly getMyReferralStatsUseCase: GetMyReferralStatsUseCase,
    private readonly referralInviteEmailUseCase: ReferralInviteEmailUseCase,
  ) {}

  async execute(idUsers: string, targetEmail: string): Promise<void> {
    const normalizedEmail = targetEmail.trim().toLowerCase();

    const alreadyInvited = await this.referralInviteRepository.findOne({
      where: { idUsers, targetEmail: normalizedEmail },
    });

    if (alreadyInvited) {
      throw AppException.from(
        APP_ERRORS.referrals.inviteAlreadySent,
        undefined,
      );
    }

    const [referrer, stats] = await Promise.all([
      this.userRepository.findOneOrFail({ where: { idUsers } }),
      this.getMyReferralStatsUseCase.execute(idUsers),
    ]);

    try {
      await this.referralInviteEmailUseCase.send({
        to: normalizedEmail,
        referrerName: referrer.name,
        referralCode: stats.referralCode,
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      throw AppException.from(
        APP_ERRORS.referrals.inviteEmailFailed,
        undefined,
      );
    }

    await this.referralInviteRepository.save(
      this.referralInviteRepository.create({
        idUsers,
        targetEmail: normalizedEmail,
      }),
    );
  }
}
