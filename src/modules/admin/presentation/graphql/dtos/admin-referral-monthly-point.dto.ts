import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { AdminReferralMonthlyPoint } from "@/modules/admin/application/ports/admin-repository.port";

@ObjectType()
export class AdminReferralMonthlyPointDto {
  static fromView(
    view: AdminReferralMonthlyPoint,
  ): AdminReferralMonthlyPointDto {
    const dto = new AdminReferralMonthlyPointDto();
    dto.month = view.month;
    dto.qualifiedReferrals = view.qualifiedReferrals;
    dto.creditsGrantedCents = view.creditsGrantedCents;
    return dto;
  }

  @Field()
  month!: string;

  @Field(() => Int)
  qualifiedReferrals!: number;

  @Field(() => Int)
  creditsGrantedCents!: number;
}
