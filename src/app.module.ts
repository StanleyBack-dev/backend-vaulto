// LIBS
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";

// INTERCEPTORS
import { AppController } from "@/app.controller";
import { formatGraphqlError } from "@/common/exceptions/graphql-error.formatter";
import { RateLimitGuard } from "@/common/guards/rate-limit.guard";
import { RequestInfoInterceptor } from "@/common/interceptors/request-info.interceptors";
import { AppConfigModule } from "@/config/config.module";
import { DatabaseModule } from "@/database/database.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { CategoriesModule } from "@/modules/categories/categories.module";
import { CreditCardsModule } from "@/modules/credit-cards/credit-cards.module";
import { DebtsModule } from "@/modules/debts/debts.module";
import { IncomesModule } from "@/modules/incomes/incomes.module";
import { MailModule } from "@/modules/mails/mail.module";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { PdfGeneratorModule } from "@/modules/pdf-generator/pdf-generator.module";
import { ReportsModule } from "@/modules/reports/reports.module";
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
    UsersModule,
    CategoriesModule,
    CreditCardsModule,
    PdfGeneratorModule,
    DebtsModule,
    PaymentsModule,
    IncomesModule,
    ReportsModule,
  ],
  providers: [RateLimitGuard, RequestInfoInterceptor],
})
export class AppModule {}
