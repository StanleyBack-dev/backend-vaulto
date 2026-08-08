import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { SubscribeToProUseCase } from "@/modules/billing/application/use-cases/create/subscribe-to-pro.use-case";
import { SubscribeToProInputDto } from "@/modules/billing/presentation/graphql/dtos/subscribe-to-pro-input.dto";
import { SubscribeToProResponseDto } from "@/modules/billing/presentation/graphql/dtos/subscribe-to-pro-response.dto";
import { SubscriptionResponseDto } from "@/modules/billing/presentation/graphql/dtos/subscription-response.dto";

@Resolver()
export class BillingResolver {
  constructor(
    private readonly getMySubscriptionUseCase: GetMySubscriptionUseCase,
    private readonly subscribeToProUseCase: SubscribeToProUseCase,
  ) {}

  @Query(() => SubscriptionResponseDto, { name: "mySubscription" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async mySubscription(@CurrentUser() user: AuthenticatedUser) {
    const subscription = await this.getMySubscriptionUseCase.execute(
      user.idUsers,
    );

    return SubscriptionResponseDto.fromView(subscription);
  }

  @Mutation(() => SubscribeToProResponseDto, { name: "subscribeToPro" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async subscribeToPro(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SubscribeToProInputDto,
  ) {
    const result = await this.subscribeToProUseCase.execute(user.idUsers, {
      cpfCnpj: input.cpfCnpj,
      billingCycle: input.billingCycle,
    });

    return SubscribeToProResponseDto.fromResult(result);
  }
}
