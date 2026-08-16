import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthPermission } from "@/modules/auth/domain/enums/auth-permission.enum";
import { RequirePermissions } from "@/modules/auth/presentation/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { GetMySubscriptionUseCase } from "@/modules/billing/application/use-cases/get/get-my-subscription.use-case";
import { ListMyBillingPaymentsUseCase } from "@/modules/billing/application/use-cases/get/list-my-billing-payments.use-case";
import { SubscribeToProUseCase } from "@/modules/billing/application/use-cases/create/subscribe-to-pro.use-case";
import { CancelSubscriptionUseCase } from "@/modules/billing/application/use-cases/update/cancel-subscription.use-case";
import { BillingPaymentsResponseDto } from "@/modules/billing/presentation/graphql/dtos/billing-payments-response.dto";
import { CancelSubscriptionInputDto } from "@/modules/billing/presentation/graphql/dtos/cancel-subscription-input.dto";
import { ListBillingPaymentsInputDto } from "@/modules/billing/presentation/graphql/dtos/list-billing-payments-input.dto";
import { SubscribeToProInputDto } from "@/modules/billing/presentation/graphql/dtos/subscribe-to-pro-input.dto";
import { SubscribeToProResponseDto } from "@/modules/billing/presentation/graphql/dtos/subscribe-to-pro-response.dto";
import { SubscriptionResponseDto } from "@/modules/billing/presentation/graphql/dtos/subscription-response.dto";

@Resolver()
export class BillingResolver {
  constructor(
    private readonly getMySubscriptionUseCase: GetMySubscriptionUseCase,
    private readonly listMyBillingPaymentsUseCase: ListMyBillingPaymentsUseCase,
    private readonly subscribeToProUseCase: SubscribeToProUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
  ) {}

  @Query(() => SubscriptionResponseDto, { name: "mySubscription" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async mySubscription(@CurrentUser() user: AuthenticatedUser) {
    const subscription = await this.getMySubscriptionUseCase.execute(
      user.idUsers,
    );

    return SubscriptionResponseDto.fromView(subscription);
  }

  @Query(() => BillingPaymentsResponseDto, { name: "myBillingPayments" })
  @RequirePermissions(AuthPermission.READ_OWN_PROFILE)
  async myBillingPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input", { nullable: true }) input?: ListBillingPaymentsInputDto,
  ) {
    const result = await this.listMyBillingPaymentsUseCase.execute(
      user.idUsers,
      input,
    );

    return BillingPaymentsResponseDto.fromResult(result);
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
      pixAutomatic: input.pixAutomatic,
    });

    return SubscribeToProResponseDto.fromResult(result);
  }

  @Mutation(() => SubscriptionResponseDto, { name: "cancelSubscription" })
  @RequirePermissions(AuthPermission.MANAGE_OWN_PROFILE)
  async cancelSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CancelSubscriptionInputDto,
  ) {
    const subscription = await this.cancelSubscriptionUseCase.execute(
      user.idUsers,
      {
        reasons: input.reasons,
        otherReason: input.otherReason,
      },
    );

    return SubscriptionResponseDto.fromView(subscription);
  }
}
