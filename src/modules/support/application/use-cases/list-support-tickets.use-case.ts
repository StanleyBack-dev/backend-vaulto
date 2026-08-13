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
import type { ListSupportTicketsQuery } from "@/modules/support/application/dto/list-support-tickets.query";
import type { SupportTicketAdminView } from "@/modules/support/application/dto/support-ticket-admin-view.type";
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type SupportMessageRepositoryPort,
  type SupportTicketView,
} from "@/modules/support/application/ports/support-message-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class ListSupportTicketsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly supportMessageRepository: SupportMessageRepositoryPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    idUsers: string,
    query: ListSupportTicketsQuery,
  ): Promise<PaginatedResult<SupportTicketAdminView>> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.READ_SUPPORT_TICKETS,
    );

    const { page, limit } = resolvePagination(query.page, query.limit);

    const { records, total } =
      await this.supportMessageRepository.listTicketsPaginated({
        page,
        limit,
        filters: { status: query.status, category: query.category },
      });

    const items = await this.attachUserInfo(records);

    return {
      items,
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }

  private async attachUserInfo(
    tickets: SupportTicketView[],
  ): Promise<SupportTicketAdminView[]> {
    const relevantIds = tickets.flatMap((ticket) =>
      ticket.finalizedByAdminId
        ? [ticket.idUsers, ticket.finalizedByAdminId]
        : [ticket.idUsers],
    );
    const uniqueIds = [...new Set(relevantIds)];
    const users = uniqueIds.length
      ? await this.userRepository.find({
          where: { idUsers: In(uniqueIds) },
        })
      : [];
    const usersById = new Map(users.map((user) => [user.idUsers, user]));

    return tickets.map((ticket) => ({
      ...ticket,
      userName: usersById.get(ticket.idUsers)?.name ?? "—",
      userEmail: usersById.get(ticket.idUsers)?.email ?? "—",
      finalizedByName: ticket.finalizedByAdminId
        ? (usersById.get(ticket.finalizedByAdminId)?.name ?? "—")
        : undefined,
    }));
  }
}
