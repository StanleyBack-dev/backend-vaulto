import { Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { SubscriptionResponseDto } from "@/modules/billing/presentation/graphql/dtos/subscription-response.dto";

@Resolver()
export class BillingResolver {
  constructor(
    private readonly getMySubscriptionUseCase: GetMySubscriptionUseCase,
  ) {}

  @Query(() => SubscriptionResponseDto, { name: "mySubscription" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async mySubscription(@CurrentUser() user: AuthenticatedUser) {
    const subscription = await this.getMySubscriptionUseCase.execute(
      user.idUsers,
    );

    return SubscriptionResponseDto.fromView(subscription);
  }
}
