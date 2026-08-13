// LIBS
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";

// INTERCEPTORS
import { AppController } from "@/app.controller";
import { formatGraphqlError } from "@/common/exceptions/graphql-error.formatter";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { RateLimiterService } from "@/common/rate-limit/rate-limiter.service";
import { UpstashRedisProvider } from "@/common/rate-limit/upstash-redis.provider";
import { RequestInfoInterceptor } from "@/common/interceptors/request-info.interceptors";
import { AppConfigModule } from "@/config/config.module";
import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { CategoriesModule } from "@/modules/categories/categories.module";
import { CreditCardsModule } from "@/modules/credit-cards/credit-cards.module";
import { DebtsModule } from "@/modules/debts/debts.module";
import { ExcelGeneratorModule } from "@/modules/excel-generator/excel-generator.module";
import { ExportsModule } from "@/modules/exports/exports.module";
import { GoalsModule } from "@/modules/goals/goals.module";
import { IncomeReceiptsModule } from "@/modules/income-receipts/income-receipts.module";
import { IncomesModule } from "@/modules/incomes/incomes.module";
import { MailModule } from "@/modules/mails/mail.module";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { PdfGeneratorModule } from "@/modules/pdf-generator/pdf-generator.module";
import { RemindersModule } from "@/modules/reminders/reminders.module";
import { ReportsModule } from "@/modules/reports/reports.module";
import { SupportModule } from "@/modules/support/support.module";
import { UsersModule } from "@/modules/users/users.module";

@Module({
  controllers: [AppController],
  imports: [
    AppConfigModule,
    DatabaseModule,
    MailModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile:
        process.env.NODE_ENV === "production"
          ? true
          : join(process.cwd(), "src/graphql/schema.gql"),
      playground: true,
      context: ({ req, res }) => ({ req, res }),
      formatError: formatGraphqlError,
    }),
    AuthModule,
    BillingModule,
    UsersModule,
    CategoriesModule,
    CreditCardsModule,
    PdfGeneratorModule,
    ExcelGeneratorModule,
    DebtsModule,
    PaymentsModule,
    IncomesModule,
    IncomeReceiptsModule,
    ReportsModule,
    RemindersModule,
    GoalsModule,
    ExportsModule,
    SupportModule,
  ],
  providers: [
    UpstashRedisProvider,
    RateLimiterService,
    RequestInfoInterceptor,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
