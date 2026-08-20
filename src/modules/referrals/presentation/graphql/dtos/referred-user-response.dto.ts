import { Field, ObjectType } from "@nestjs/graphql";
import type { ReferredUserResult } from "@/modules/referrals/application/use-cases/get-my-referrals.use-case";

@ObjectType()
export class ReferredUserResponseDto {
  static fromResult(result: ReferredUserResult): ReferredUserResponseDto {
    const dto = new ReferredUserResponseDto();
    dto.name = result.name;
    dto.email = result.email;
    dto.qualifiedAt = result.qualifiedAt ?? undefined;
    return dto;
  }

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => Date, { nullable: true })
  qualifiedAt?: Date;
}
