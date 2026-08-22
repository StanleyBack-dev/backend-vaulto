import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import type { ListMarketingEmailSendsQuery } from "@/modules/marketing-emails/application/dto/list-marketing-email-sends.query";
import type { MarketingEmailSendAdminView } from "@/modules/marketing-emails/application/dto/marketing-email-send-admin-view.type";
import {
  MARKETING_EMAIL_REPOSITORY,
  type MarketingEmailRepositoryPort,
  type MarketingEmailSendView,
} from "@/modules/marketing-emails/application/ports/marketing-email-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class ListMarketingEmailSendsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(MARKETING_EMAIL_REPOSITORY)
    private readonly marketingEmailRepository: MarketingEmailRepositoryPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    adminId: string,
    query: ListMarketingEmailSendsQuery,
  ): Promise<PaginatedResult<MarketingEmailSendAdminView>> {
    await this.authorizationService.assertPermissionForUserId(
      adminId,
      AuthPermission.READ_MARKETING_EMAILS,
    );

    const { page, limit } = resolvePagination(query.page, query.limit);

    const { records, total } =
      await this.marketingEmailRepository.listPaginated({
        page,
        limit,
        filters: {
          category: query.category,
          recipientEmail:
            query.recipientEmail?.trim().toLowerCase() || undefined,
        },
      });

    const items = await this.attachAdminNames(records);

    return {
      items,
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }

  private async attachAdminNames(
    records: MarketingEmailSendView[],
  ): Promise<MarketingEmailSendAdminView[]> {
    const uniqueAdminIds = [
      ...new Set(records.map((record) => record.sentByAdminId)),
    ];
    const admins = uniqueAdminIds.length
      ? await this.userRepository.find({
          where: { idUsers: In(uniqueAdminIds) },
        })
      : [];
    const adminsById = new Map(admins.map((admin) => [admin.idUsers, admin]));

    return records.map((record) => ({
      ...record,
      sentByAdminName: adminsById.get(record.sentByAdminId)?.name ?? "—",
    }));
  }
}
