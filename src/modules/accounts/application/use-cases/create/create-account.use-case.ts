import { Inject, Injectable } from "@nestjs/common";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import {
  ACCOUNT_REPOSITORY,
  type AccountRepositoryPort,
  type AccountView,
} from "@/modules/accounts/application/ports/account-repository.port";
import { CreateAccountCommand } from "@/modules/accounts/application/dto/create/create-account.command";

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(userId: string, command: CreateAccountCommand): Promise<AccountView> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.MANAGE_OWN_ACCOUNTS,
    );

    return this.accountRepository.create({
      idUsers: userId,
      name: command.name,
      accountType: command.accountType,
      initialBalance: command.initialBalance,
    });
  }
}



