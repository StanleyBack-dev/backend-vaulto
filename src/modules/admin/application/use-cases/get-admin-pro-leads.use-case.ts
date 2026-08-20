import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  ADMIN_REPOSITORY,
  type AdminProLeadRow,
  type AdminProLeadsFilter,
  type AdminRepositoryPort,
} from "@/modules/admin/application/ports/admin-repository.port";

@Injectable()
export class GetAdminProLeadsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: AdminRepositoryPort,
  ) {}

  async execute(
    idUsers: string,
    filter: AdminProLeadsFilter,
  ): Promise<PaginatedResult<AdminProLeadRow>> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.READ_ADMIN_DASHBOARD,
    );

    return this.adminRepository.listProLeads(filter);
  }
}
