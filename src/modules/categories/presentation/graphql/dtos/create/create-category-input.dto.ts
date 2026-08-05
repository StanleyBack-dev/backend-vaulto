import { Field, InputType } from "@nestjs/graphql";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

@InputType()
export class CreateCategoryInputDto {
  @Field()
  name!: string;

  @Field(() => CategoryType, { nullable: true })
  type?: CategoryType;

  @Field({ nullable: true })
  status?: boolean;
}
