import { Field, ObjectType } from "@nestjs/graphql";
import type { SubscribeToProResult } from "@/modules/billing/application/use-cases/create/subscribe-to-pro.use-case";
import { SubscriptionResponseDto } from "@/modules/billing/presentation/graphql/dtos/subscription-response.dto";

@ObjectType()
export class SubscribeToProResponseDto {
  static fromResult(result: SubscribeToProResult): SubscribeToProResponseDto {
    const dto = new SubscribeToProResponseDto();
    dto.subscription = SubscriptionResponseDto.fromView(result.subscription);
    dto.checkoutUrl = result.checkoutUrl;
    return dto;
  }

  @Field(() => SubscriptionResponseDto)
  subscription!: SubscriptionResponseDto;

  @Field({ nullable: true })
  checkoutUrl?: string;
}
