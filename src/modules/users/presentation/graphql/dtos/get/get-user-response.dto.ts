import { Int, ObjectType, Field } from "@nestjs/graphql";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import type { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@ObjectType()
export class GetUserResponseDto {
  static fromEntity(
    entity: UserEntity,
    credential?: AuthCredentialEntity | null,
  ) {
    const dto = new GetUserResponseDto();
    dto.idUsers = entity.idUsers;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.urlAvatar = entity.urlAvatar;
    dto.status = entity.status;
    dto.group = entity.group;
    dto.inactivatedAt = entity.inactivatedAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.username = credential?.username;
    dto.mustChangePassword = credential?.mustChangePassword;
    dto.lastLoginAt = credential?.lastLoginAt;
    dto.failedLoginAttempts = credential?.failedLoginAttempts;
    dto.lockedUntil = credential?.lockUntil;
    return dto;
  }

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  urlAvatar?: string;

  @Field()
  status!: boolean;

  @Field(() => UserGroup)
  group!: UserGroup;

  @Field({ nullable: true })
  inactivatedAt?: Date;

  @Field({ nullable: true })
  mustChangePassword?: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field(() => Int, { nullable: true })
  failedLoginAttempts?: number;

  @Field(() => Date, { nullable: true })
  lockedUntil?: Date | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

