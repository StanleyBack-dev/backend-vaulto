import { Field, ObjectType } from "@nestjs/graphql";
import type { SupportMessageStatusView } from "@/modules/support/application/use-cases/get-support-message-status.use-case";

@ObjectType()
export class SupportMessageStatusResponseDto {
  static fromView(
    view: SupportMessageStatusView,
  ): SupportMessageStatusResponseDto {
    const dto = new SupportMessageStatusResponseDto();
    dto.canSend = view.canSend;
    dto.nextAllowedAt = view.nextAllowedAt ?? undefined;
    return dto;
  }

  @Field()
  canSend!: boolean;

  @Field(() => Date, { nullable: true })
  nextAllowedAt?: Date;
}
