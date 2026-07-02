import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { PaginatedResult } from "@/common/responses/interfaces/response.interface";
import {
  calculateHasNextPage,
  calculateTotalPages,
  resolvePagination,
} from "@/common/responses/helpers/pagination.helper";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { GetUserInputDto } from "@/modules/users/presentation/graphql/dtos/get/get-user-input.dto";
import { GetUserResponseDto } from "@/modules/users/presentation/graphql/dtos/get/get-user-response.dto";
import { GetUsersInputDto } from "@/modules/users/presentation/graphql/dtos/get/get-users-input.dto";
import { GetUserValidator } from "@/modules/users/application/validators/get/get-user.validator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { AuthorizationService } from "@/modules/auth/application/use-cases/authorization.use-case";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";

@Injectable()
export class GetUsersUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    @InjectRepository(AuthCredentialEntity)
    private readonly authCredentialRepo: Repository<AuthCredentialEntity>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  private async loadCredentialsByUserIds(userIds: string[]) {
    if (!userIds.length) {
      return new Map<string, AuthCredentialEntity>();
    }

    const credentials = await this.authCredentialRepo.find({
      where: { idUsers: In(userIds) },
    });

    return new Map(
      credentials.map((credential) => [credential.idUsers, credential]),
    );
  }

  async findOne(userId: string, input: GetUserInputDto) {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_USERS,
    );

    GetUserValidator.ensureValidInput(input);

    const where = input.idUsers
      ? { idUsers: input.idUsers }
      : { email: ILike((input.email || "").trim().toLowerCase()) };

    const user = await this.repo.findOne({ where });

    if (!user) {
      throw AppException.from(APP_ERRORS.users.notFound, undefined);
    }

    const credential = await this.authCredentialRepo.findOne({
      where: { idUsers: user.idUsers },
    });

    return GetUserResponseDto.fromEntity(user, credential);
  }

  async findAll(
    userId: string,
    input?: GetUsersInputDto,
  ): Promise<PaginatedResult<GetUserResponseDto>> {
    await this.authorizationService.assertPermissionForUserId(
      userId,
      AuthPermission.READ_USERS,
    );

    const { page, limit, skip } = resolvePagination(input?.page, input?.limit);
    const [records, total] = await this.repo.findAndCount({
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    const credentialMap = await this.loadCredentialsByUserIds(
      records.map((record) => record.idUsers),
    );

    return {
      items: records.map((record) =>
        GetUserResponseDto.fromEntity(
          record,
          credentialMap.get(record.idUsers),
        ),
      ),
      total,
      currentPage: page,
      limit,
      totalPages: calculateTotalPages(limit, total),
      hasNextPage: calculateHasNextPage(page, limit, total),
    };
  }

  async findByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.repo.findOne({ where: { email: ILike(normalizedEmail) } });
  }

  async findById(idUsers: string) {
    return this.repo.findOne({ where: { idUsers } });
  }

  async findByIdOrFail(idUsers: string) {
    await this.authorizationService.assertPermissionForUserId(
      idUsers,
      AuthPermission.READ_OWN_USER,
    );

    const user = await this.findById(idUsers);

    if (!user) {
      throw AppException.from(APP_ERRORS.users.notFound, undefined);
    }

    const credential = await this.authCredentialRepo.findOne({
      where: { idUsers: user.idUsers },
    });

    return GetUserResponseDto.fromEntity(user, credential);
  }
}



