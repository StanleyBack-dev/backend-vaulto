import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { MailModule } from "@/modules/mails/mail.module";
import { SUPPORT_MESSAGE_REPOSITORY } from "@/modules/support/application/ports/support-message-repository.port";
import { FinalizeSupportTicketUseCase } from "@/modules/support/application/use-cases/finalize-support-ticket.use-case";
import { GetSupportMessageStatusUseCase } from "@/modules/support/application/use-cases/get-support-message-status.use-case";
import { GetSupportTicketUseCase } from "@/modules/support/application/use-cases/get-support-ticket.use-case";
import { ListSupportTicketsUseCase } from "@/modules/support/application/use-cases/list-support-tickets.use-case";
import { ReplyToSupportTicketUseCase } from "@/modules/support/application/use-cases/reply-to-support-ticket.use-case";
import { SendSupportMessageUseCase } from "@/modules/support/application/use-cases/send-support-message.use-case";
import { SupportMessageEntity } from "@/modules/support/infrastructure/persistence/typeorm/entities/support-message.entity";
import { SupportMessageTypeormRepository } from "@/modules/support/infrastructure/persistence/typeorm/repositories/support-message-typeorm.repository";
import { SupportAdminResolver } from "@/modules/support/presentation/graphql/resolvers/support-admin.resolver";
import { SupportResolver } from "@/modules/support/presentation/graphql/resolvers/support.resolver";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import "@/modules/support/presentation/graphql/enums/support-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportMessageEntity, UserEntity]),
    AuthModule,
    MailModule,
  ],
  providers: [
    SendSupportMessageUseCase,
    GetSupportMessageStatusUseCase,
    ListSupportTicketsUseCase,
    GetSupportTicketUseCase,
    ReplyToSupportTicketUseCase,
    FinalizeSupportTicketUseCase,
    SupportResolver,
    SupportAdminResolver,
    SupportMessageTypeormRepository,
    {
      provide: SUPPORT_MESSAGE_REPOSITORY,
      useExisting: SupportMessageTypeormRepository,
    },
  ],
})
export class SupportModule {}
