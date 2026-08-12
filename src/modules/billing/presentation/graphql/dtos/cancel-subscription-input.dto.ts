import { Field, InputType } from "@nestjs/graphql";
import { CancellationReason } from "@/modules/billing/domain/enums/cancellation-reason.enum";

@InputType()
export class CancelSubscriptionInputDto {
  @Field(() => [CancellationReason])
  reasons!: CancellationReason[];

  @Field({ nullable: true })
  otherReason?: string;
}
