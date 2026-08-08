import { Module } from "@nestjs/common";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { PasswordChangedEmailUseCase } from "@/modules/mails/application/use-cases/password-changed-email.use-case";
import { PasswordRecoveryEmailUseCase } from "@/modules/mails/application/use-cases/password-recovery-email.use-case";
import { PaymentOverdueEmailUseCase } from "@/modules/mails/application/use-cases/payment-overdue-email.use-case";
import { SubscriptionActivatedEmailUseCase } from "@/modules/mails/application/use-cases/subscription-activated-email.use-case";
import { SubscriptionTrialEndingEmailUseCase } from "@/modules/mails/application/use-cases/subscription-trial-ending-email.use-case";
import { UserOnboardingEmailUseCase } from "@/modules/mails/application/use-cases/user-onboarding-email.use-case";
import { UserWelcomeEmailUseCase } from "@/modules/mails/application/use-cases/user-welcome-email.use-case";
import { BrevoMailProvider } from "@/modules/mails/infrastructure/providers/brevo-mail.provider";

@Module({
  providers: [
    {
      provide: MAIL_PROVIDER,
      useClass: BrevoMailProvider,
    },
    PasswordRecoveryEmailUseCase,
    UserOnboardingEmailUseCase,
    UserWelcomeEmailUseCase,
    PasswordChangedEmailUseCase,
    SubscriptionTrialEndingEmailUseCase,
    SubscriptionActivatedEmailUseCase,
    PaymentOverdueEmailUseCase,
  ],
  exports: [
    MAIL_PROVIDER,
    PasswordRecoveryEmailUseCase,
    UserOnboardingEmailUseCase,
    UserWelcomeEmailUseCase,
    PasswordChangedEmailUseCase,
    SubscriptionTrialEndingEmailUseCase,
    SubscriptionActivatedEmailUseCase,
    PaymentOverdueEmailUseCase,
  ],
})
export class MailModule {}
