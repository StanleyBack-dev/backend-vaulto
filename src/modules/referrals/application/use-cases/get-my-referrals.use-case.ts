import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

export interface ReferredUserResult {
  name: string;
  email: string;
  qualifiedAt: Date | null;
}

@Injectable()
export class GetMyReferralsUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(idUsers: string): Promise<ReferredUserResult[]> {
    const referredUsers = await this.userRepository.find({
      where: { referredByUserId: idUsers },
      order: { createdAt: "DESC" },
    });

    return referredUsers.map((user) => ({
      name: user.name,
      email: user.email,
      qualifiedAt: user.referralQualifiedAt ?? null,
    }));
  }
}
