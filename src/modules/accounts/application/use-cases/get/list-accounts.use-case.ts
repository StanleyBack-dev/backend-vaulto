import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
  type AccountView,
} from "@/modules/accounts/application/ports/account-repository.port";

@Injectable()
export class ListAccountsUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(userId: string): Promise<AccountView[]> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_OWN_ACCOUNTS,
    );

    return this.accountRepository.listByUser(userId);
  }
}



