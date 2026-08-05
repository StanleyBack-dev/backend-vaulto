import { Field, InputType } from "@nestjs/graphql";
import { CategoryType } from "@/modules/categories/domain/enums/category-type.enum";

@InputType()
export class UpdateCategoryInputDto {
  @Field()
  idCategory!: string;

  @Field()
  name!: string;

  @Field(() => CategoryType, { nullable: true })
  type?: CategoryType;

  @Field()
  status!: boolean;
}
