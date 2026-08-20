import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { AdminReferralLeaderboardRow } from "@/modules/admin/application/ports/admin-repository.port";

@ObjectType()
export class AdminReferralLeaderboardRowDto {
  static fromView(
    view: AdminReferralLeaderboardRow,
  ): AdminReferralLeaderboardRowDto {
    const dto = new AdminReferralLeaderboardRowDto();
    dto.idUsers = view.idUsers;
    dto.name = view.name;
    dto.email = view.email;
    dto.qualifiedReferralsCount = view.qualifiedReferralsCount;
    dto.totalCreditsGrantedCents = view.totalCreditsGrantedCents;
    dto.availableBalanceCents = view.availableBalanceCents;
    return dto;
  }

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => Int)
  qualifiedReferralsCount!: number;

  @Field(() => Int)
  totalCreditsGrantedCents!: number;

  @Field(() => Int)
  availableBalanceCents!: number;
}
