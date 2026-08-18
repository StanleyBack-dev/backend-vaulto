import { Module } from "@nestjs/common";
import { MAIL_PROVIDER } from "@/modules/mails/application/ports/mail-provider.token";
import { AccountDeactivationConfirmationEmailUseCase } from "@/modules/mails/application/use-cases/account-deactivation-confirmation-email.use-case";
import { AccountReactivationWelcomeBackEmailUseCase } from "@/modules/mails/application/use-cases/account-reactivation-welcome-back-email.use-case";
import { AccountDeletionRequestedEmailUseCase } from "@/modules/mails/application/use-cases/account-deletion-requested-email.use-case";
import { AccountDeletionCancelledEmailUseCase } from "@/modules/mails/application/use-cases/account-deletion-cancelled-email.use-case";
import { DueTomorrowReminderEmailUseCase } from "@/modules/mails/application/use-cases/due-tomorrow-reminder-email.use-case";
import { PasswordChangedEmailUseCase } from "@/modules/mails/application/use-cases/password-changed-email.use-case";
import { PasswordRecoveryEmailUseCase } from "@/modules/mails/application/use-cases/password-recovery-email.use-case";
import { PaymentOverdueEmailUseCase } from "@/modules/mails/application/use-cases/payment-overdue-email.use-case";
import { ReferralCreditGrantedEmailUseCase } from "@/modules/mails/application/use-cases/referral-credit-granted-email.use-case";
import { SubscriptionActivatedEmailUseCase } from "@/modules/mails/application/use-cases/subscription-activated-email.use-case";
import { SubscriptionCanceledNotificationEmailUseCase } from "@/modules/mails/application/use-cases/subscription-canceled-notification-email.use-case";
import { SubscriptionContractedNotificationEmailUseCase } from "@/modules/mails/application/use-cases/subscription-contracted-notification-email.use-case";
import { SupportMessageConfirmationEmailUseCase } from "@/modules/mails/application/use-cases/support-message-confirmation-email.use-case";
import { SupportMessageNotificationEmailUseCase } from "@/modules/mails/application/use-cases/support-message-notification-email.use-case";
import { SupportTicketFinalizedEmailUseCase } from "@/modules/mails/application/use-cases/support-ticket-finalized-email.use-case";
import { SupportTicketReplyEmailUseCase } from "@/modules/mails/application/use-cases/support-ticket-reply-email.use-case";
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
    SubscriptionActivatedEmailUseCase,
    SubscriptionContractedNotificationEmailUseCase,
    SubscriptionCanceledNotificationEmailUseCase,
    PaymentOverdueEmailUseCase,
    DueTomorrowReminderEmailUseCase,
    SupportMessageNotificationEmailUseCase,
    SupportMessageConfirmationEmailUseCase,
    SupportTicketReplyEmailUseCase,
    SupportTicketFinalizedEmailUseCase,
    AccountDeactivationConfirmationEmailUseCase,
    AccountReactivationWelcomeBackEmailUseCase,
    AccountDeletionRequestedEmailUseCase,
    AccountDeletionCancelledEmailUseCase,
    ReferralCreditGrantedEmailUseCase,
  ],
  exports: [
    MAIL_PROVIDER,
    PasswordRecoveryEmailUseCase,
    UserOnboardingEmailUseCase,
    UserWelcomeEmailUseCase,
    PasswordChangedEmailUseCase,
    SubscriptionActivatedEmailUseCase,
    SubscriptionContractedNotificationEmailUseCase,
    SubscriptionCanceledNotificationEmailUseCase,
    PaymentOverdueEmailUseCase,
    DueTomorrowReminderEmailUseCase,
    SupportMessageNotificationEmailUseCase,
    SupportMessageConfirmationEmailUseCase,
    SupportTicketReplyEmailUseCase,
    SupportTicketFinalizedEmailUseCase,
    AccountDeactivationConfirmationEmailUseCase,
    AccountReactivationWelcomeBackEmailUseCase,
    AccountDeletionRequestedEmailUseCase,
    AccountDeletionCancelledEmailUseCase,
    ReferralCreditGrantedEmailUseCase,
  ],
})
export class MailModule {}
