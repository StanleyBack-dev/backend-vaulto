import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetMyReferralStatsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import { GetMyReferralWithdrawalsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-withdrawals.use-case";
import { GetMyReferralsUseCase } from "@/modules/referrals/application/use-cases/get-my-referrals.use-case";
import { LookupReferralWithdrawalPixKeyUseCase } from "@/modules/referrals/application/use-cases/lookup-referral-withdrawal-pix-key.use-case";
import { RequestReferralWithdrawalUseCase } from "@/modules/referrals/application/use-cases/request-referral-withdrawal.use-case";
import { SendReferralInviteUseCase } from "@/modules/referrals/application/use-cases/send-referral-invite.use-case";
import { LookupPixKeyInputDto } from "@/modules/referrals/presentation/graphql/dtos/lookup-pix-key-input.dto";
import { PixKeyLookupResponseDto } from "@/modules/referrals/presentation/graphql/dtos/pix-key-lookup-response.dto";
import { ReferralStatsResponseDto } from "@/modules/referrals/presentation/graphql/dtos/referral-stats-response.dto";
import { ReferralWithdrawalResponseDto } from "@/modules/referrals/presentation/graphql/dtos/referral-withdrawal-response.dto";
import { ReferredUserResponseDto } from "@/modules/referrals/presentation/graphql/dtos/referred-user-response.dto";
import { RequestReferralWithdrawalInputDto } from "@/modules/referrals/presentation/graphql/dtos/request-referral-withdrawal-input.dto";
import { SendReferralInviteInputDto } from "@/modules/referrals/presentation/graphql/dtos/send-referral-invite-input.dto";
import "@/modules/referrals/presentation/graphql/enums/referrals-graphql.enums";

@Resolver()
export class ReferralsResolver {
  constructor(
    private readonly getMyReferralStatsUseCase: GetMyReferralStatsUseCase,
    private readonly getMyReferralWithdrawalsUseCase: GetMyReferralWithdrawalsUseCase,
    private readonly getMyReferralsUseCase: GetMyReferralsUseCase,
    private readonly requestReferralWithdrawalUseCase: RequestReferralWithdrawalUseCase,
    private readonly lookupReferralWithdrawalPixKeyUseCase: LookupReferralWithdrawalPixKeyUseCase,
    private readonly sendReferralInviteUseCase: SendReferralInviteUseCase,
  ) {}

  @Query(() => ReferralStatsResponseDto, { name: "myReferralStats" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async myReferralStats(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.getMyReferralStatsUseCase.execute(user.idUsers);

    return ReferralStatsResponseDto.fromResult(result);
  }

  @Query(() => [ReferralWithdrawalResponseDto], {
    name: "myReferralWithdrawals",
  })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async myReferralWithdrawals(@CurrentUser() user: AuthenticatedUser) {
    const withdrawals = await this.getMyReferralWithdrawalsUseCase.execute(
      user.idUsers,
    );

    return withdrawals.map(ReferralWithdrawalResponseDto.fromView);
  }

  @Query(() => PixKeyLookupResponseDto, {
    name: "lookupReferralWithdrawalPixKey",
  })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async lookupReferralWithdrawalPixKey(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: LookupPixKeyInputDto,
  ) {
    const result = await this.lookupReferralWithdrawalPixKeyUseCase.execute(
      user.idUsers,
      {
        pixKey: input.pixKey,
        pixKeyType: input.pixKeyType,
      },
    );

    return PixKeyLookupResponseDto.fromResult(result);
  }

  @Query(() => [ReferredUserResponseDto], { name: "myReferrals" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async myReferrals(@CurrentUser() user: AuthenticatedUser) {
    const referrals = await this.getMyReferralsUseCase.execute(user.idUsers);

    return referrals.map(ReferredUserResponseDto.fromResult);
  }

  @Mutation(() => Boolean, { name: "sendReferralInvite" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async sendReferralInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SendReferralInviteInputDto,
  ) {
    await this.sendReferralInviteUseCase.execute(user.idUsers, input.email);

    return true;
  }

  @Mutation(() => ReferralWithdrawalResponseDto, {
    name: "requestReferralWithdrawal",
  })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async requestReferralWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RequestReferralWithdrawalInputDto,
  ) {
    const withdrawal = await this.requestReferralWithdrawalUseCase.execute(
      user.idUsers,
      {
        pixKey: input.pixKey,
        pixKeyType: input.pixKeyType,
      },
    );

    return ReferralWithdrawalResponseDto.fromView(withdrawal);
  }
}
