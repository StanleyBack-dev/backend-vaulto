import { Field, ObjectType } from "@nestjs/graphql";
import type { SupportMessageView } from "@/modules/support/application/ports/support-message-repository.port";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

@ObjectType()
export class SupportMessageResponseDto {
  static fromView(view: SupportMessageView): SupportMessageResponseDto {
    const dto = new SupportMessageResponseDto();
    dto.category = view.category;
    dto.message = view.message;
    dto.createdAt = view.createdAt;
    return dto;
  }

  @Field(() => SupportCategory)
  category!: SupportCategory;

  @Field()
  message!: string;

  @Field(() => Date)
  createdAt!: Date;
}
