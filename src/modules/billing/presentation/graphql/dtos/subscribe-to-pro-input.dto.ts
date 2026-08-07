import { Field, InputType } from "@nestjs/graphql";
import { SubscriptionBillingCycle } from "@/modules/billing/domain/enums/subscription-billing-cycle.enum";

@InputType()
export class SubscribeToProInputDto {
  @Field()
  cpfCnpj!: string;

  @Field(() => SubscriptionBillingCycle)
  billingCycle!: SubscriptionBillingCycle;
}
