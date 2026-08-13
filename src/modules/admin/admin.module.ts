import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@/modules/auth/auth.module";
import { ADMIN_REPOSITORY } from "@/modules/admin/application/ports/admin-repository.port";
import { GetAdminDashboardStatsUseCase } from "@/modules/admin/application/use-cases/get-admin-dashboard-stats.use-case";
import { AdminTypeormRepository } from "@/modules/admin/infrastructure/persistence/typeorm/repositories/admin-typeorm.repository";
import { AdminResolver } from "@/modules/admin/presentation/graphql/resolvers/admin.resolver";
import { SubscriptionEntity } from "@/modules/billing/infrastructure/persistence/typeorm/entities/subscription.entity";
import { SupportMessageEntity } from "@/modules/support/infrastructure/persistence/typeorm/entities/support-message.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      SubscriptionEntity,
      SupportMessageEntity,
    ]),
    AuthModule,
  ],
  providers: [
    GetAdminDashboardStatsUseCase,
    AdminResolver,
    AdminTypeormRepository,
    {
      provide: ADMIN_REPOSITORY,
      useExisting: AdminTypeormRepository,
    },
  ],
})
export class AdminModule {}
