import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { ExcelGeneratorModule } from "@/modules/excel-generator/excel-generator.module";
import { MailModule } from "@/modules/mails/mail.module";
import { MARKETING_EMAIL_REPOSITORY } from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";
import { ExportMarketingEmailSendsUseCase } from "@/modules/marketing-emails/application/use-cases/export-marketing-email-sends.use-case";
import { GetMarketingEmailDefaultTemplateUseCase } from "@/modules/marketing-emails/application/use-cases/get-marketing-email-default-template.use-case";
import { GetMarketingEmailRecipientCooldownUseCase } from "@/modules/marketing-emails/application/use-cases/get-marketing-email-recipient-cooldown.use-case";
import { ListMarketingEmailSendsUseCase } from "@/modules/marketing-emails/application/use-cases/list-marketing-email-sends.use-case";
import { PreviewMarketingEmailUseCase } from "@/modules/marketing-emails/application/use-cases/preview-marketing-email.use-case";
import { SendMarketingEmailUseCase } from "@/modules/marketing-emails/application/use-cases/send-marketing-email.use-case";
import { UpdateMarketingEmailSendContactUseCase } from "@/modules/marketing-emails/application/use-cases/update-marketing-email-send-contact.use-case";
import { MarketingEmailSendEntity } from "@/modules/marketing-emails/infrastructure/persistence/typeorm/entities/marketing-email-send.entity";
import { MarketingEmailSendTypeormRepository } from "@/modules/marketing-emails/infrastructure/persistence/typeorm/repositories/marketing-email-send-typeorm.repository";
import { MarketingEmailResolver } from "@/modules/marketing-emails/presentation/graphql/resolvers/marketing-email.resolver";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import "@/modules/marketing-emails/presentation/graphql/enums/marketing-email-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketingEmailSendEntity, UserEntity]),
    AuthModule,
    MailModule,
    ExcelGeneratorModule,
  ],
  providers: [
    GetMarketingEmailDefaultTemplateUseCase,
    PreviewMarketingEmailUseCase,
    GetMarketingEmailRecipientCooldownUseCase,
    ListMarketingEmailSendsUseCase,
    SendMarketingEmailUseCase,
    ExportMarketingEmailSendsUseCase,
    UpdateMarketingEmailSendContactUseCase,
    MarketingEmailResolver,
    MarketingEmailSendTypeormRepository,
    {
      provide: MARKETING_EMAIL_REPOSITORY,
      useExisting: MarketingEmailSendTypeormRepository,
    },
  ],
})
export class MarketingEmailsModule {}
