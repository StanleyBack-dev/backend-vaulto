import { Field, Int, ObjectType } from "@nestjs/graphql";
import type { AdminReferralStatsView } from "@/modules/admin/application/ports/admin-repository.port";

@ObjectType()
export class AdminReferralStatsResponseDto {
  static fromView(view: AdminReferralStatsView): AdminReferralStatsResponseDto {
    const dto = new AdminReferralStatsResponseDto();
    dto.totalReferredUsers = view.totalReferredUsers;
    dto.totalQualifiedReferrals = view.totalQualifiedReferrals;
    dto.creditAmountCents = view.creditAmountCents;
    dto.totalCreditsGrantedCents = view.totalCreditsGrantedCents;
    dto.totalClawedBackCents = view.totalClawedBackCents;
    dto.totalWithdrawnCents = view.totalWithdrawnCents;
    dto.totalPendingWithdrawalCents = view.totalPendingWithdrawalCents;
    dto.totalFailedWithdrawalCents = view.totalFailedWithdrawalCents;
    dto.totalOutstandingLiabilityCents = view.totalOutstandingLiabilityCents;
    return dto;
  }

  @Field(() => Int)
  totalReferredUsers!: number;

  @Field(() => Int)
  totalQualifiedReferrals!: number;

  @Field(() => Int)
  creditAmountCents!: number;

  @Field(() => Int)
  totalCreditsGrantedCents!: number;

  @Field(() => Int)
  totalClawedBackCents!: number;

  @Field(() => Int)
  totalWithdrawnCents!: number;

  @Field(() => Int)
  totalPendingWithdrawalCents!: number;

  @Field(() => Int)
  totalFailedWithdrawalCents!: number;

  @Field(() => Int)
  totalOutstandingLiabilityCents!: number;
}
