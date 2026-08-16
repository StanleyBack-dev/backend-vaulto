import { Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetMyReferralStatsUseCase } from "@/modules/referrals/application/use-cases/get-my-referral-stats.use-case";
import { ReferralStatsResponseDto } from "@/modules/referrals/presentation/graphql/dtos/referral-stats-response.dto";
import "@/modules/referrals/presentation/graphql/enums/referrals-graphql.enums";

@Resolver()
export class ReferralsResolver {
  constructor(
    private readonly getMyReferralStatsUseCase: GetMyReferralStatsUseCase,
  ) {}

  @Query(() => ReferralStatsResponseDto, { name: "myReferralStats" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async myReferralStats(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.getMyReferralStatsUseCase.execute(user.idUsers);

    return ReferralStatsResponseDto.fromResult(result);
  }
}
