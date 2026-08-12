import { Module } from "@nestjs/common";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { DueTomorrowReminderEmailUseCase } from "@/modules/mails/application/use-cases/due-tomorrow-reminder-email.use-case";
import { PasswordChangedEmailUseCase } from "@/modules/mails/application/use-cases/password-changed-email.use-case";
import { PasswordRecoveryEmailUseCase } from "@/modules/mails/application/use-cases/password-recovery-email.use-case";
import { PaymentOverdueEmailUseCase } from "@/modules/mails/application/use-cases/payment-overdue-email.use-case";
import { SubscriptionActivatedEmailUseCase } from "@/modules/mails/application/use-cases/subscription-activated-email.use-case";
import { SubscriptionCanceledNotificationEmailUseCase } from "@/modules/mails/application/use-cases/subscription-canceled-notification-email.use-case";
import { SubscriptionContractedNotificationEmailUseCase } from "@/modules/mails/application/use-cases/subscription-contracted-notification-email.use-case";
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
    SubscriptionContractedNotificationEmailUseCase,
    SubscriptionCanceledNotificationEmailUseCase,
    PaymentOverdueEmailUseCase,
    DueTomorrowReminderEmailUseCase,
  ],
  exports: [
    MAIL_PROVIDER,
    PasswordRecoveryEmailUseCase,
    UserOnboardingEmailUseCase,
    UserWelcomeEmailUseCase,
    PasswordChangedEmailUseCase,
    SubscriptionTrialEndingEmailUseCase,
    SubscriptionActivatedEmailUseCase,
    SubscriptionContractedNotificationEmailUseCase,
    SubscriptionCanceledNotificationEmailUseCase,
    PaymentOverdueEmailUseCase,
    DueTomorrowReminderEmailUseCase,
  ],
})
export class MailModule {}
