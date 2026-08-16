import { Field, InputType } from "@nestjs/graphql";
import { SupportCategory } from "@/modules/support/domain/enums/support-category.enum";

@InputType()
export class SendSupportMessageInputDto {
  @Field(() => SupportCategory)
  category!: SupportCategory;

  @Field()
  message!: string;
}
