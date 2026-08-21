import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { AppException } from "@/common/exceptions/app-exception";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { ProLeadEvent } from "@/modules/billing/domain/enums/pro-lead-event.enum";
import {
  PRO_LEAD_EVENT_REPOSITORY,
  type ProLeadEventRepositoryPort,
} from "@/modules/billing/application/ports/pro-lead-event-repository.port";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class RecordProLeadClickUseCase {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(PRO_LEAD_EVENT_REPOSITORY)
    private readonly proLeadEventRepository: ProLeadEventRepositoryPort,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(idUsers: string): Promise<void> {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.MANAGE_OWN_PROFILE,
    );

    const user = await this.userRepository.findOne({ where: { idUsers } });
    if (!user) {
      throw AppException.from(
        APP_ERRORS.authorization.authenticatedUserNotFound,
        undefined,
      );
    }

    await this.proLeadEventRepository.record({
      idUsers,
      email: user.email,
      name: user.name,
      event: ProLeadEvent.PLAN_CLICKED,
    });
  }
}
