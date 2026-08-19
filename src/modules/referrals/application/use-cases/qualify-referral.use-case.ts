import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  REFERRAL_CREDIT_AMOUNT_CENTS,
  REFERRAL_CREDIT_HOLD_DAYS,
} from "@/modules/referrals/domain/constants/referral.constant";
import {
  REFERRAL_CREDIT_REPOSITORY,
  type ReferralCreditRepositoryPort,
} from "@/modules/referrals/application/ports/referral-credit-repository.port";
import { ReferralCreditGrantedEmailUseCase } from "@/modules/mails/application/use-cases/referral-credit-granted-email.use-case";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Called from HandleAsaasWebhookUseCase the moment a subscription's first
// charge is actually confirmed paid. Also registered directly in
// BillingModule (in addition to ReferralsModule) so the webhook handler can
// inject it without BillingModule importing ReferralsModule — see comment on
// ReferralCreditEntity registration in billing.module.ts.
@Injectable()
export class QualifyReferralUseCase {
  private readonly logger = new Logger(QualifyReferralUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(REFERRAL_CREDIT_REPOSITORY)
    private readonly referralCreditRepository: ReferralCreditRepositoryPort,
    private readonly referralCreditGrantedEmailUseCase: ReferralCreditGrantedEmailUseCase,
  ) {}

  async execute(idUsers: string): Promise<void> {
    const referredUser = await this.userRepository.findOne({
      where: { idUsers },
    });

    if (!referredUser?.referredByUserId || referredUser.referralQualifiedAt) {
      return;
    }

    const qualifiedAt = new Date();
    await this.userRepository.update(
      { idUsers },
      { referralQualifiedAt: qualifiedAt },
    );

    await this.grantCredit(referredUser.referredByUserId, idUsers, qualifiedAt);
  }

  private async grantCredit(
    referrerId: string,
    referredUserId: string,
    qualifiedAt: Date,
  ): Promise<void> {
    await this.referralCreditRepository.create({
      idUsers: referrerId,
      idReferredUser: referredUserId,
      amountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
      qualifiedAt,
      availableAt: new Date(
        qualifiedAt.getTime() + REFERRAL_CREDIT_HOLD_DAYS * DAY_IN_MS,
      ),
    });

    await this.notifyReferrer(referrerId);
  }

  private async notifyReferrer(idUsers: string): Promise<void> {
    const referrer = await this.userRepository.findOne({
      where: { idUsers },
    });
    if (!referrer) {
      return;
    }

    try {
      await this.referralCreditGrantedEmailUseCase.send({
        to: referrer.email,
        name: referrer.name,
        amountCents: REFERRAL_CREDIT_AMOUNT_CENTS,
        holdDays: REFERRAL_CREDIT_HOLD_DAYS,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      this.logger.error(
        `Falha no envio de email de crédito de indicação para ${referrer.email}: ${message}`,
      );
    }
  }
}
